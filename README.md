# Gerenciador de tarefas

## Comandos para rodar o projeto localmente

`npm i`

para instalar as dependências

`npm run dev`

para rodar o servidor

`docker-compose up -d`

para rodar o banco de dados localmente em background

`npx prisma generate` 

para gerar automaticamente o Prisma Client

`npx prisma migrate dev`

para gerar as tabelas

## Documentação dos endpoints

## users

### para criar um usuário admin POST/users :

{
  "name": "Rodrigo",
  "email": "rodrigo@email.com",
  "password": "123456",
  "role": "admin",
}

## sessions

### para criar uma sessão POST/sessions:

{
"email": "rodrigo@email.com",
"password": "123456"
}

## teams

precisa do token para dizer se é admin
### para criar um time POST/teams:

{
  "title": "Time de exemplo",
  "description": "exemplo de descrição de time"
}

precisa do token para dizer se é admin
### para listar os times criados GET/teams

qualquer role pode ver
### para ver as tarefas do time GET/teams/id_do_time

precisa do token para dizer se é admin
### para atualizar os dados da tarefa do time PATCH/teams/id_da_tarefa

precisa do token para dizer se é admin
### para remover o time DELETE/teams/id_do_time_que_deseja_remover

## tasks

precisa do token para dizer se é admin
### para criar uma tarefa POST/tasks

{
  "title": "Aplicando as animações",
	"description": "aplicando animações para botões, divs, etc",
	"user_id": "id_do_usuario",
	"team_id": "id_do_time"
}

se não colocar priority nem status o status por padrão será pending e a priority será low

precisa do token para dizer se é admin
### para listar todas as tarefas GET/tasks


precisa do token para dizer se é admin
### para atualizar qualquer tarefa se for um admin PARTCH/tasks/admin/id_da_tarefa_a_ser_atualizada

{
  "title": "", > 💬 **Nota:** opcional
  "description": "", > 💬 **Nota:** opcional
  "status": "", > 💬 **Nota:** opcional
  "priority": "", > 💬 **Nota:** opcional
}


### para atualizar apenas as suas tarefas PATCH/tasks/member/id_da_tarefa_a_ser_atualizada

### para filtrar as tarefas por status GET/tasks/status/nome_do_status_que_quer_filtrar

### para filtrar as tarefas por status GET/tasks/priority/nome_da_prioridade_que_quer_filtrar

### para remover uma tarefa DELETE/tasks/id_da_tarefa

## tasks_history

### para listar todas as vezes que o satus de uma tarefa foi mudado GET/tasks_history/id_da_tarefa 

## member_teams

### para criar um membro do time POST/team_members

{
	"user_id": "id_do_usuario_que_deseja_colocar_no_time",
	"team_id": "id_do_time_ao_qual_ele_será_atribuido"
}

### para listar os membros de um time GET/team_members/id_do_time_que_deseja_listar_os_membros

### para remover um membro de um time DELETE/team_members/id_do_membro_do_time_que_deseja_remover

## link do deploy

https://gerenciador-de-tarefas-3.onrender.com

## para rodar os testes

`npm run test:dev`

para sair do modo watch ctrl + c ou pressionar a tecla q
