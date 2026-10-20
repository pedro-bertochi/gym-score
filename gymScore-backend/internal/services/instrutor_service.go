package services

import (
	"time"

	"gymScore-backend/internal/models"
	"gymScore-backend/internal/repositories"

	"gorm.io/gorm"
)

// InstrutorService define as operações de negócio para instrutores
type InstrutorService interface {
	// Criar ativa o perfil de instrutor do PRÓPRIO usuário logado (identidade do JWT, nunca do corpo).
	Criar(userID uint, req *models.CriarInstrutorRequest) (*models.InstrutorResponse, error)
	BuscarPorUsuario(idUsuario uint) (*models.Instrutor, error)
	// Listar é o diretório de instrutores (dados públicos: nome, CREF, especialidade).
	Listar() ([]models.InstrutorResponse, error)
	// Agenda devolve só os desafios em que o usuário é o instrutor designado.
	Agenda(userID uint, status models.StatusDesafio, pagina, limite int) (*models.ListaDesafiosResponse, error)
}

type instrutorService struct {
	db          *gorm.DB
	repo        repositories.InstrutorRepository
	usuarioRepo repositories.UsuarioRepository
	vinculos    *repositories.VinculoInstrutorRepository
	desafios    *repositories.DesafioRepository
	agora       func() time.Time
}

// NovoInstrutorService cria uma nova instância do serviço de instrutores
func NovoInstrutorService(
	db *gorm.DB,
	repo repositories.InstrutorRepository,
	usuarioRepo repositories.UsuarioRepository,
	vinculos *repositories.VinculoInstrutorRepository,
	desafios *repositories.DesafioRepository,
) InstrutorService {
	return &instrutorService{db: db, repo: repo, usuarioRepo: usuarioRepo, vinculos: vinculos, desafios: desafios, agora: time.Now}
}

func paraInstrutorResponse(i *models.Instrutor) models.InstrutorResponse {
	r := models.InstrutorResponse{ID: i.ID, CREF: i.CREF, Especialidade: i.Especialidade, Autonomo: i.IDAcademia == nil}
	if i.Usuario != nil {
		r.Nome, r.Sobrenome = i.Usuario.Nome, i.Usuario.Sobrenome
	}
	return r
}

// Criar promove o usuário logado a instrutor (autônomo: o vínculo com a academia é feito por ela).
// Só conta de atleta pode ser promovida, e não enquanto estiver inscrita em desafio aberto ou em
// andamento (instrutor não pode sair do desafio nem receber prêmio como atleta). O perfil e o
// registro de instrutor são gravados na mesma transação.
func (s *instrutorService) Criar(userID uint, req *models.CriarInstrutorRequest) (*models.InstrutorResponse, error) {
	usuario, err := s.usuarioRepo.BuscarPorID(userID)
	if err != nil {
		return nil, err
	}
	if usuario == nil {
		return nil, erro(401, "Usuário não encontrado")
	}
	switch usuario.Perfil {
	case "instrutor":
		return nil, erroConflito("Você já tem o perfil de instrutor")
	case "academia":
		return nil, erroProibido("Contas de academia não podem se tornar instrutor")
	}
	if existente, err := s.repo.BuscarPorUsuario(userID); err != nil {
		return nil, err
	} else if existente != nil {
		return nil, erroConflito("Você já tem o perfil de instrutor")
	}
	ativas, err := s.desafios.ContarInscricoesAtivas(userID)
	if err != nil {
		return nil, err
	}
	if ativas > 0 {
		return nil, erroConflito("Você está inscrito em desafio aberto ou em andamento. Saia dele ou aguarde o encerramento antes de virar instrutor")
	}

	instrutor := &models.Instrutor{IDUsuario: userID, CREF: req.CREF, Especialidade: req.Especialidade}
	err = s.db.Transaction(func(tx *gorm.DB) error {
		repo := s.vinculos.ComTx(tx)
		ok, err := repo.PromoverUsuario(userID)
		if err != nil {
			return err
		}
		if !ok {
			return erroConflito("Apenas contas de atleta podem se tornar instrutor")
		}
		return repo.Criar(instrutor)
	})
	if err != nil {
		if repositories.EhDuplicata(err) { // duas requisições simultâneas
			return nil, erroConflito("Você já tem o perfil de instrutor")
		}
		return nil, err
	}
	instrutor.Usuario = usuario
	r := paraInstrutorResponse(instrutor)
	return &r, nil
}

// BuscarPorUsuario retorna o instrutor vinculado ao ID de usuário informado
func (s *instrutorService) BuscarPorUsuario(idUsuario uint) (*models.Instrutor, error) {
	return s.repo.BuscarPorUsuario(idUsuario)
}

// Listar retorna o diretório de instrutores (sem e-mail, CPF nem id de usuário).
func (s *instrutorService) Listar() ([]models.InstrutorResponse, error) {
	lista, err := s.vinculos.ListarTodos()
	if err != nil {
		return nil, err
	}
	out := make([]models.InstrutorResponse, 0, len(lista))
	for i := range lista {
		out = append(out, paraInstrutorResponse(&lista[i]))
	}
	return out, nil
}

// Agenda devolve os desafios em que o usuário é o instrutor DESIGNADO, paginados. Sem status: abertos
// e em andamento, do evento mais próximo ao mais distante. Com status: só os desse status (aberto e
// em andamento do mais próximo ao mais distante; encerrado e cancelado do mais recente ao mais antigo).
func (s *instrutorService) Agenda(userID uint, status models.StatusDesafio, pagina, limite int) (*models.ListaDesafiosResponse, error) {
	if status != "" && !statusValido(status) {
		return nil, erroRequisicao("status inválido (use aberto, em_andamento, encerrado ou cancelado)")
	}
	pagina, limite = normalizarPagina(pagina, limite)
	vazio := &models.ListaDesafiosResponse{Itens: []models.DesafioResponse{}, Pagina: pagina, Limite: limite}
	inst, err := s.repo.BuscarPorUsuario(userID)
	if err != nil {
		return nil, err
	}
	if inst == nil {
		return vazio, nil
	}
	filtro := repositories.FiltroDesafios{
		IDUsuario: userID, Todos: true, IDInstrutor: inst.ID, Status: status,
		Agora: s.agora(), Pagina: pagina, Limite: limite, Ordem: repositories.OrdemEventoProx,
	}
	switch status {
	case "":
		filtro.Statuses = statusAtivos
	case models.StatusEncerrado, models.StatusCancelado:
		filtro.Ordem = repositories.OrdemEventoRec
	}
	ds, total, err := s.desafios.Listar(filtro)
	if err != nil {
		return nil, err
	}
	ctx := &contextoUsuario{ID: userID, Perfil: "instrutor", InstrutorID: inst.ID}
	agora := s.agora()
	itens := make([]models.DesafioResponse, 0, len(ds))
	for i := range ds {
		itens = append(itens, *montarResposta(&ds[i], ctx, false, agora))
	}
	return &models.ListaDesafiosResponse{Itens: itens, Total: total, Pagina: pagina, Limite: limite}, nil
}
