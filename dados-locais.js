/* Armazenamento local para rodar o app fora do Claude (por exemplo, no GitHub Pages).
   Dentro do Claude, window.claude já existe e este arquivo não faz nada.
   Aqui os dados ficam no localStorage deste navegador: não são compartilhados entre aparelhos. */
(function(){
  if(window.claude&&window.claude.use)return;
  var CHAVE='petshop.db',store=new Map(),listeners=new Set(),n=Date.now();
  var clone=function(x){return JSON.parse(JSON.stringify(x))};
  function salvar(){try{localStorage.setItem(CHAVE,JSON.stringify(Array.from(store.entries())))}catch(e){}}
  function notify(){salvar();Array.from(listeners).forEach(function(l){Promise.resolve().then(l)})}
  function snapDoc(path){var d=store.get(path);return {id:path.split('/').pop(),exists:!!d,data:function(){return d?clone(d):undefined},metadata:{fromCache:false,hasPendingWrites:false}}}
  function mkDoc(path){return {id:path.split('/').pop(),path:path,
    get:function(){return Promise.resolve(snapDoc(path))},
    set:function(d){store.set(path,clone(d));notify();return Promise.resolve()},
    update:function(d){if(!store.has(path))return Promise.reject({code:'invalid_argument',message:'documento inexistente'});store.set(path,Object.assign({},store.get(path),clone(d)));notify();return Promise.resolve()},
    delete:function(){store.delete(path);notify();return Promise.resolve()},
    onSnapshot:function(fn){var l=function(){fn(snapDoc(path))};listeners.add(l);Promise.resolve().then(l);return function(){listeners.delete(l)}},
    collection:function(p){return mkCol(path+'/'+p)}}}
  function mkCol(path,filtros,lim){filtros=filtros||[];lim=lim||1000;
    function run(){var prof=path.split('/').length+1;
      var docs=Array.from(store.keys()).filter(function(k){return k.indexOf(path+'/')===0&&k.split('/').length===prof}).sort().map(snapDoc);
      filtros.forEach(function(f){docs=docs.filter(function(d){var x=d.data()[f[0]];return f[1]==='=='?x===f[2]:f[1]==='>='?x>=f[2]:true})});
      docs=docs.slice(0,lim);return {docs:docs,size:docs.length,empty:!docs.length,docChanges:function(){return []},metadata:{fromCache:false,hasPendingWrites:false}}}
    return {path:path,
      where:function(f,op,v){return mkCol(path,filtros.concat([[f,op,v]]),lim)},
      orderBy:function(){return this},limit:function(k){return mkCol(path,filtros,k)},
      get:function(){return Promise.resolve(run())},
      onSnapshot:function(fn){var l=function(){fn(run())};listeners.add(l);Promise.resolve().then(l);return function(){listeners.delete(l)}},
      doc:function(id){return mkDoc(path+'/'+(id||('d'+(++n).toString(36))))},
      add:function(d){var r=this.doc();return r.set(d).then(function(){return r})}}}

  var carregou=false;
  try{var bruto=localStorage.getItem(CHAVE);if(bruto){JSON.parse(bruto).forEach(function(e){store.set(e[0],e[1])});carregou=true}}catch(e){}
  if(!carregou)exemplos();

  function exemplos(){
    var pad=function(x){return String(x).padStart(2,'0')};
    var ymd=function(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
    var dia=function(k){var d=new Date();d.setDate(d.getDate()+k);return ymd(d)};
    var T=dia(0),A=dia(1),O=dia(-1);
    var add=function(c,id,d){store.set(c+'/'+id,d)};
    add('config','loja',{nome:'Meu Pet Shop',telefone:'',endereco:'',abre:'08:00',fecha:'18:00',dias:[1,2,3,4,5,6],capacidade:2});
    var sv=[['banho-p','Banho porte P',5000,60],['banho-m','Banho porte M',6500,60],['banho-g','Banho porte G',8500,90],['banho-tosa','Banho e tosa higiênica',9000,90],['tosa-completa','Tosa completa',12000,120],['unhas','Corte de unhas',2500,30],['hidratacao','Hidratação de pelos',4000,30]];
    sv.forEach(function(s){add('servicos',s[0],{nome:s[1],preco:s[2],duracao:s[3],ativo:true,exemplo:true})});
    var S=function(id){var s=sv.filter(function(x){return x[0]===id})[0];return {id:s[0],nome:s[1],preco:s[2]}};
    [['ex-c1','Mariana Souza','(11) 90000-0001'],['ex-c2','Rafael Lima','(11) 90000-0002'],['ex-c3','Beatriz Andrade','(11) 90000-0003'],['ex-c4','João Pedro Martins','(11) 90000-0004']]
      .forEach(function(c){add('clientes',c[0],{nome:c[1],telefone:c[2],email:'',endereco:'',obs:'',criadoEm:new Date().toISOString(),exemplo:true})});
    [['ex-p1','ex-c1','Thor','Cachorro','Golden Retriever','G','2021-03-10',''],['ex-p2','ex-c1','Mel','Cachorro','Shih-tzu','P','2023-06-22','Pele sensível: usar shampoo neutro'],['ex-p3','ex-c2','Nina','Gato','SRD','P','2022-01-15','Estressa com secador'],['ex-p4','ex-c3','Bob','Cachorro','SRD','M','',''],['ex-p5','ex-c4','Luna','Cachorro','Poodle','P','2019-11-02','']]
      .forEach(function(p){add('pets',p[0],{clienteId:p[1],nome:p[2],especie:p[3],raca:p[4],porte:p[5],nascimento:p[6],obs:p[7],exemplo:true})});
    [['ex-r1','Ração seca adulto 10 kg','Ração',18990,14200,6,3],['ex-r2','Ração seca filhote 3 kg','Ração',7990,5600,2,3],['ex-r3','Sachê úmido para gatos 85 g','Ração',450,280,40,20],['ex-r4','Shampoo neutro 500 ml','Higiene',3290,1900,5,4],['ex-r5','Tapete higiênico 30 un.','Higiene',5990,4100,0,2],['ex-r6','Areia sanitária 4 kg','Higiene',2490,1500,9,5],['ex-r7','Coleira ajustável M','Acessórios',3990,2200,4,2],['ex-r8','Petisco bifinho 60 g','Petiscos',890,500,12,10]]
      .forEach(function(p){add('produtos',p[0],{nome:p[1],categoria:p[2],preco:p[3],custo:p[4],qtd:p[5],minimo:p[6],exemplo:true})});
    var ocup={};
    var ag=function(id,data,hora,dur,c,p,s,status,vendaId){
      add('agenda/'+data.slice(0,7)+'/itens',id,{data:data,hora:hora,duracao:dur,clienteId:c,petId:p,servicos:[S(s)],profissional:'',obs:'',status:status,vendaId:vendaId||null,exemplo:true});
      var h=hora.split(':').map(Number),ini=h[0]*60+h[1];ocup[data]=ocup[data]||{};
      for(var t=ini;t<ini+dur;t+=30){var k=pad(Math.floor(t/60))+':'+pad(t%60);ocup[data][k]=(ocup[data][k]||0)+1}};
    ag('ex-a1',T,'09:00',90,'ex-c1','ex-p1','banho-g','concluido','ex-v1');
    ag('ex-a2',T,'10:30',90,'ex-c1','ex-p2','banho-tosa','concluido');
    ag('ex-a3',T,'16:00',60,'ex-c3','ex-p4','banho-m','atendimento');
    ag('ex-a4',T,'17:00',30,'ex-c2','ex-p3','unhas','agendado');
    ag('ex-a5',A,'09:00',120,'ex-c4','ex-p5','tosa-completa','agendado');
    Object.keys(ocup).forEach(function(d){add('ocupacao',d,{data:d,slots:ocup[d]})});
    var vd=function(id,data,hora,c,itens,pag,agId){var t=itens.reduce(function(a,i){return a+i.preco*i.qtd},0);
      add('caixa/'+data.slice(0,7)+'/vendas',id,{data:data,hora:hora,clienteId:c,itens:itens,subtotal:t,desconto:0,total:t,pagamento:pag,cancelada:false,agendamentoId:agId||null,agMes:agId?T.slice(0,7):null,criadoEm:new Date().toISOString(),exemplo:true})};
    vd('ex-v1',T,'10:35','ex-c1',[{tipo:'servico',id:'banho-g',nome:'Banho porte G',preco:8500,qtd:1}],'pix','ex-a1');
    vd('ex-v2',T,'11:20',null,[{tipo:'produto',id:'ex-r8',nome:'Petisco bifinho 60 g',preco:890,qtd:2},{tipo:'produto',id:'ex-r3',nome:'Sachê úmido para gatos 85 g',preco:450,qtd:4}],'dinheiro');
    vd('ex-v3',O,'15:10','ex-c3',[{tipo:'produto',id:'ex-r1',nome:'Ração seca adulto 10 kg',preco:18990,qtd:1}],'credito');
    salvar();
  }

  var db={doc:mkDoc,collection:function(p){return mkCol(p)}};
  var user={canEdit:function(){return Promise.resolve(true)},isOwner:function(){return Promise.resolve(true)}};
  window.claude={use:function(nome){return Promise.resolve(nome==='db'?db:nome==='user'?user:null)}};
  window.addEventListener('DOMContentLoaded',function(){
    var p=document.createElement('p');
    p.textContent='Modo local: os dados ficam salvos só neste navegador e não são compartilhados com outros aparelhos.';
    p.style.cssText='max-width:1080px;margin:0 auto;padding:0 16px 24px;font-size:13px;color:var(--muted)';
    document.body.appendChild(p);
  });
})();
