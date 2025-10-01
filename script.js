const state={logged:false, current: 'tela-login', users:JSON.parse(localStorage.getItem("usuarios")||"[]"), alunos:[], faltas:[]};
let seqAluno = state.alunos.length + 1
let seqFalta = 1

const $ = sel => document.querySelector(sel)
const $$ = sel => Array.from(document.querySelectorAll(sel))
const fmt = new Intl.DateTimeFormat('pt-BR')

function setScreen(id){
  state.current = id
  $$('#screens > section').forEach(s => s.classList.toggle('hidden', s.id !== id))
  $$('#sideMenu button, #topNav button').forEach(b => b.classList.toggle('active', b.dataset.target === id))
  if(id !== 'tela-login') fillCombos()
  if(id === 'tela-consulta-alunos') renderAlunos()
  if(id === 'tela-historico-faltas') renderHistorico()
}

// Navegação
function setupNav(){
  const menuItems = [
    {id:'tela-cadastro-aluno', label:'Cadastro Aluno'},
    {id:'tela-consulta-alunos', label:'Consulta Alunos'},
    {id:'tela-registro-faltas', label:'Registro Faltas'},
    {id:'tela-historico-faltas', label:'Histórico'},
    {id:'tela-relatorios', label:'Relatórios'}
  ]
  $('#sideMenu').innerHTML = menuItems.map(m=>`<button data-target="${m.id}">${m.label}</button>`).join('')
  $$('#sideMenu button, #topNav button').forEach(b=>{
    b.addEventListener('click',()=>setScreen(b.dataset.target))
  })
}

// Alunos
function renderAlunos(){
  const busca=$('#buscaAluno').value.toLowerCase()
  $('#tbodyAlunos').innerHTML = state.alunos
    .filter(a=>a.nome.toLowerCase().includes(busca)||a.matricula.includes(busca))
    .map(a=>`
      <tr>
        <td>${a.nome}</td>
        <td>${a.matricula}</td>
        <td>${a.turma}</td>
        <td>
          <button class="btn secondary" data-edit="${a.id}">Editar</button>
          <button class="btn danger" data-del="${a.id}">Excluir</button>
        </td>
      </tr>`).join('')
}
$('#buscaAluno').addEventListener('input', renderAlunos)
$('#btnNovoAluno').addEventListener('click',()=>setScreen('tela-cadastro-aluno'))
$('#tbodyAlunos').addEventListener('click', e=>{
  if(e.target.dataset.edit){
    const a=state.alunos.find(x=>x.id==e.target.dataset.edit)
    $('#alunoId').value=a.id
    $('#alunoNome').value=a.nome
    $('#alunoMatricula').value=a.matricula
    $('#alunoTurma').value=a.turma
    setScreen('tela-cadastro-aluno')
  }
  if(e.target.dataset.del){
    if(confirm('Excluir aluno?')){
      state.alunos=state.alunos.filter(x=>x.id!=e.target.dataset.del)
      renderAlunos()
    }
  }
})
$('#formAluno').addEventListener('submit', e=>{
  e.preventDefault()
  const id=$('#alunoId').value
  const nome=$('#alunoNome').value.trim()
  const matricula=$('#alunoMatricula').value.trim()
  const turma=$('#alunoTurma').value.trim()
  if(id){
    const a=state.alunos.find(x=>x.id==id)
    a.nome=nome;a.matricula=matricula;a.turma=turma
  }else{
    if(state.alunos.some(x=>x.matricula===matricula)){
      $('#hintAluno').textContent='Já existe aluno com esta matrícula.'
      return
    }
    state.alunos.push({id:seqAluno++,nome,matricula,turma})
  }
  $('#formAluno').reset(); $('#alunoId').value=''
  setScreen('tela-consulta-alunos')
})
$('#btnCancelarAluno').addEventListener('click',()=>{
  $('#formAluno').reset(); $('#alunoId').value=''
  setScreen('tela-consulta-alunos')
})

// Registro de faltas
function fillCombos(){
  $('#faltaAluno').innerHTML = state.alunos.map(a=>`<option value="${a.id}">${a.nome} (${a.matricula})</option>`).join('')
  $('#histAluno').innerHTML = '<option value="">Todos</option>' + state.alunos.map(a=>`<option value="${a.id}">${a.nome}</option>`).join('')
}
$('#formFalta').addEventListener('submit', e=>{
  e.preventDefault()
  const alunoId=+$('#faltaAluno').value
  const data=$('#faltaData').value
  const sit=[...document.querySelectorAll('[name=situacao]')].find(r=>r.checked).value
  state.faltas.push({id:seqFalta++,alunoId,data,situacao:sit})
  $('#formFalta').reset()
  $('#hintFalta').textContent='Registro salvo.'
})

// Histórico
function renderHistorico(){
  const aid=$('#histAluno').value
  const turma=$('#histTurma').value.toLowerCase()
  const de=$('#histDe').value, ate=$('#histAte').value
  $('#tbodyHistorico').innerHTML = state.faltas
    .filter(f=>{
      const a=state.alunos.find(x=>x.id==f.alunoId)
      if(aid && a.id!=aid) return false
      if(turma && !a.turma.toLowerCase().includes(turma)) return false
      if(de && f.data<de) return false
      if(ate && f.data>ate) return false
      return true
    })
    .map(f=>{
      const a=state.alunos.find(x=>x.id==f.alunoId)
      return `<tr>
        <td>${fmt.format(new Date(f.data))}</td>
        <td>${a.nome}</td>
        <td>${a.matricula}</td>
        <td>${a.turma}</td>
        <td><span class="badge ${f.situacao==='FALTA'?'no':'ok'}">${f.situacao}</span></td>
      </tr>`
    }).join('')
}
$('#btnFiltrarHist').addEventListener('click', renderHistorico)
$('#btnLimparHist').addEventListener('click', ()=>{
  $('#histAluno').value='';$('#histTurma').value='';$('#histDe').value='';$('#histAte').value=''
  renderHistorico()
})

// Relatórios
function gerarRelatorios(){
  const de=$('#repDe').value, ate=$('#repAte').value
  const statsAluno={}
  const statsTurma={}
  state.alunos.forEach(a=>{
    statsAluno[a.id]={aluno:a,p:0,f:0}
  })
  state.faltas.forEach(f=>{
    if(de && f.data<de) return
    if(ate && f.data>ate) return
    const st=statsAluno[f.alunoId]
    if(!st) return
    if(f.situacao==='PRESENCA') st.p++
    else st.f++
  })
  $('#tbodyRepAluno').innerHTML = Object.values(statsAluno).map(st=>`
    <tr>
      <td>${st.aluno.nome}</td>
      <td>${st.aluno.turma}</td>
      <td>${st.p}</td>
      <td>${st.f}</td>
    </tr>`).join('')
  // por turma
  state.alunos.forEach(a=>{
    if(!statsTurma[a.turma]) statsTurma[a.turma]={turma:a.turma,p:0,f:0}
  })
  state.faltas.forEach(f=>{
    if(de && f.data<de) return
    if(ate && f.data>ate) return
    const a=state.alunos.find(x=>x.id==f.alunoId)
    const st=statsTurma[a.turma]
    if(f.situacao==='PRESENCA') st.p++
    else st.f++
  })
  $('#tbodyRepTurma').innerHTML = Object.values(statsTurma).map(st=>`
    <tr>
      <td>${st.turma}</td>
      <td>${st.p}</td>
      <td>${st.f}</td>
    </tr>`).join('')
}
$('#btnGerarRel').addEventListener('click', gerarRelatorios)

// Login
$('#formLogin').addEventListener('submit',e=>{
  e.preventDefault();
  const email=$('#loginEmail').value;
  const senha=$('#loginSenha').value;
  const u=state.users.find(x=>x.email===email&&x.senha===senha);
  if(u){state.logged=true; $('#hintLogin').textContent='Login OK'; setupNav(); setScreen('tela-consulta-alunos');}
  else $('#hintLogin').textContent='E-mail ou senha inválidos!';
});

// Inicialização
document.getElementById("year").textContent=new Date().getFullYear()
setScreen('tela-login')
