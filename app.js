/* Central do Corretor · Investe Canedo — app de testes */
(function(){
"use strict";
var DADOS = window.CENTRAL_DATA;
var app = document.getElementById('app');

function brl(v){
  var n = Number(v);
  if(!isFinite(n)) return '—';
  return n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
}
function num(v){ var n = Number(v); return isFinite(n) ? n : 0; }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function hojeISO(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function soDigitos(s){ return String(s||'').replace(/\D/g,''); }
function parseNumBR(s){ return num(String(s||'').replace(/\./g,'').replace(',','.')); }
function waLink(fone,texto){
  var d = soDigitos(fone);
  if(d && d.length<=11) d = '55'+d;
  var url = d ? 'https://wa.me/'+d : 'https://wa.me/';
  if(texto) url += '?text='+encodeURIComponent(texto);
  return url;
}

/* ---------------- TABELAS ---------------- */
var estadoTab = { q:'', bundle:'all' };

function rotuloCurto(b){
  return b.label.replace(/\s*·\s*novembro\/2026.*$/,'').replace(/\s*·\s*/g,' · ');
}

function lotesFiltrados(){
  var q = estadoTab.q.trim().toLowerCase();
  var m = q.match(/(?:q(?:uadra)?\s*)?(\d+[a-z]?)\s*[\/\-\s]\s*(?:l(?:ote)?\s*)?(\d+[a-z]?)/i);
  var qQ=null,qL=null;
  if(m){ qQ=m[1].toLowerCase(); qL=m[2].toLowerCase(); }
  var out=[];
  DADOS.bundles.forEach(function(b){
    if(estadoTab.bundle!=='all' && b.id!==estadoTab.bundle) return;
    b.rows.forEach(function(r){
      if(q){
        var okTexto = b.label.toLowerCase().indexOf(q)>=0;
        var okQL = qQ!==null &&
          String(r.quadra).toLowerCase()===qQ &&
          String(r.lote).toLowerCase()===qL;
        var okParcial = !qQ && (String(r.quadra).toLowerCase()===q || String(r.lote).toLowerCase()===q);
        if(!(okTexto||okQL||okParcial)) return;
      }
      out.push({b:b,r:r});
    });
  });
  return out;
}

function renderTabelas(){
  var chips = '<div class="chips">'+
    '<button class="chip'+(estadoTab.bundle==='all'?' ativa':'')+'" data-b="all">Todas ('+DADOS.bundles.reduce(function(a,b){return a+b.rows.length;},0)+')</button>'+
    DADOS.bundles.map(function(b){
      return '<button class="chip'+(estadoTab.bundle===b.id?' ativa':'')+'" data-b="'+b.id+'">'+esc(rotuloCurto(b))+' ('+b.rows.length+')</button>';
    }).join('')+'</div>';
  var lista = lotesFiltrados();
  var linhas = lista.slice(0,200).map(function(it,i){
    var r=it.r;
    return '<div class="linha-lote" data-i="'+i+'">'+
      '<div><div class="ql">Q'+esc(r.quadra)+' · L'+esc(r.lote)+(r.stage?' <span class="info">'+esc(r.stage)+'</span>':'')+'</div>'+
      '<div class="info">'+esc(rotuloCurto(it.b))+' · '+esc(r.area_m2)+' m²</div></div>'+
      '<div class="valor">'+brl(r.cash_value_brl)+'</div></div>';
  }).join('');
  app.innerHTML =
    '<h1>Tabelas · novembro/2026</h1>'+
    '<p class="sub">Valores à vista das tabelas oficiais recebidas. Toque no lote para ver a ficha. Disponibilidade sempre sob confirmação com a loteadora.</p>'+
    '<input id="busca" inputmode="search" placeholder="Buscar: Q7 L4, 7/4 ou nome do loteamento" value="'+esc(estadoTab.q)+'">'+
    '<div style="height:10px"></div>'+chips+
    (lista.length===0 ? '<div class="vazio">Nenhum lote encontrado. Confira quadra e lote na tabela oficial.</div>' : linhas)+
    (lista.length>200 ? '<div class="vazio">Mostrando 200 de '+lista.length+' — refine a busca.</div>':'');
  document.getElementById('busca').addEventListener('input',function(e){ estadoTab.q=e.target.value; renderTabelas(); var el=document.getElementById('busca'); el.focus(); el.setSelectionRange(el.value.length,el.value.length); });
  Array.prototype.forEach.call(document.querySelectorAll('.chip'),function(c){
    c.addEventListener('click',function(){ estadoTab.bundle=c.getAttribute('data-b'); renderTabelas(); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('.linha-lote'),function(el){
    el.addEventListener('click',function(){
      var it = lotesFiltrados()[Number(el.getAttribute('data-i'))];
      abrirFicha(it.b, it.r);
    });
  });
}

function fichaTexto(b,r){
  var t = rotuloCurto(b)+'\n'+
    'Quadra '+r.quadra+' · Lote '+r.lote+(r.stage?' · '+r.stage:'')+'\n'+
    'Área: '+r.area_m2+' m²\n'+
    'À vista: '+brl(r.cash_value_brl);
  if(r.proposal_value_brl) t += '\n'+'Proposta: '+brl(r.proposal_value_brl);
  if(r.list_value_brl) t += '\n'+'Tabela: '+brl(r.list_value_brl)+(r.discount_brl?' (desconto '+brl(r.discount_brl)+')':'');
  t += '\n'+'Tabela '+b.month+', disponibilidade a confirmar.';
  return t;
}

function abrirFicha(b,r){
  fecharFicha();
  var fundo=document.createElement('div'); fundo.className='ficha-fundo'; fundo.id='ficha-fundo';
  var f=document.createElement('div'); f.className='ficha'; f.id='ficha';
  var dds = '<dt>Área</dt><dd>'+esc(r.area_m2)+' m²</dd>'+
    '<dt>À vista</dt><dd class="ouro">'+brl(r.cash_value_brl)+'</dd>';
  if(r.proposal_value_brl) dds += '<dt>Proposta</dt><dd>'+brl(r.proposal_value_brl)+'</dd>';
  if(r.list_value_brl) dds += '<dt>Tabela</dt><dd>'+brl(r.list_value_brl)+'</dd>';
  if(r.discount_brl) dds += '<dt>Desconto</dt><dd>'+brl(r.discount_brl)+'</dd>';
  f.innerHTML =
    '<h3>Q'+esc(r.quadra)+' · L'+esc(r.lote)+(r.stage?' · '+esc(r.stage):'')+'</h3>'+
    '<div class="tabela-origem">'+esc(b.label)+' · tabela recebida da loteadora · disponibilidade sob consulta</div>'+
    '<dl>'+dds+'</dl>'+
    '<div class="acoes">'+
    '<button class="botao ouro" id="copiar">Copiar ficha do lote</button>'+
    '<a class="botao" target="_blank" rel="noopener" href="'+waLink('',fichaTexto(b,r))+'">Enviar no WhatsApp</a>'+
    '<button class="botao fantasma" id="fechar">Fechar</button>'+
    '</div>';
  document.body.appendChild(fundo); document.body.appendChild(f);
  fundo.addEventListener('click',fecharFicha);
  document.getElementById('fechar').addEventListener('click',fecharFicha);
  document.getElementById('copiar').addEventListener('click',function(){
    copiar(fichaTexto(b,r));
    this.textContent='Copiado ✓';
    var bt=this; setTimeout(function(){ bt.textContent='Copiar ficha do lote'; },1500);
  });
}
function fecharFicha(){
  var f=document.getElementById('ficha'), ff=document.getElementById('ficha-fundo');
  if(f) f.remove(); if(ff) ff.remove();
}
function copiar(txt){
  if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(txt); return; }
  var ta=document.createElement('textarea'); ta.value=txt; document.body.appendChild(ta); ta.select();
  try{ document.execCommand('copy'); }catch(e){} ta.remove();
}


/* ---------------- MAPA ---------------- */
var MAPA_PINS = [
  {nome:'Parque dos Buritis', cidade:'Senador Canedo - GO', lat:-16.6786414, lng:-49.1414431, end:'R. RPB 4 - Girassóis, Sen. Canedo', bundle:'buritis-nov'},
  {nome:'Jardim Scala', cidade:'Trindade - GO', lat:-16.6325383, lng:-49.4154748, end:'Av. Tiradentes, lt. 43 - St. Cristina I', bundle:'scala-jardim-nov'},
  {nome:'Recanto das Emas', cidade:'Goiânia - GO', lat:-16.7382467, lng:-49.3673868, end:'Av. Eli Alves Forte, esq. Rua Rita Caetano', bundle:'recanto-nov'},
  {nome:'Jardim dos Ipês', cidade:'Aparecida de Goiânia - GO', lat:-16.8308595, lng:-49.3793755, end:'Av. Ji Oito, Qd 10 Lt 17 - Jardim dos Ipês', bundle:'ipes-nov'}
];
var MAPA_PLANTAS = [
  {img:'maps/map-1.webp', label:'Jardim dos Ipês · etapas 1ª e 2ª', bundle:'ipes-nov'},
  {img:'maps/map-2.webp', label:'Jardim dos Ipês · 3ª etapa', bundle:'ipes-nov'},
  {img:'maps/map-3.webp', label:'Recanto das Emas', bundle:'recanto-nov'},
  {img:'maps/map-4.webp', label:'Parque dos Buritis', bundle:'buritis-nov'},
  {img:'maps/map-5.webp', label:'Jardim das Aroeiras', bundle:'aroeiras-nov'},
  {img:'maps/map-6.webp', label:'Jardim dos Angicos', bundle:'angicos-nov'},
  {img:'maps/map-7.webp', label:'Jardim dos Jacarandás', bundle:'jacarandas-nov'},
  {img:'maps/map-8.webp', label:'Jardim Scala', bundle:'scala-jardim-nov'}
];
var mapaSat = null, mapaPlanta = null, plantaSel = null;

function irParaTabela(bundle){
  estadoTab.bundle = bundle;
  estadoTab.q = '';
  location.hash = '#/tabelas';
}

function renderMapa(){
  if(mapaSat){ mapaSat.remove(); mapaSat=null; }
  if(mapaPlanta){ mapaPlanta.remove(); mapaPlanta=null; plantaSel=null; }
  if(typeof L === 'undefined'){
    app.innerHTML = '<div class="aviso">O mapa precisa de internet para carregar. Tente de novo.</div>';
    return;
  }
  app.innerHTML =
    '<h1>Mapa</h1>'+
    '<p class="sub">Onde fica cada loteamento e a planta de referência para mostrar ao cliente.</p>'+
    '<div class="cartao"><h3>Satélite · pontos de referência</h3>'+
    '<div id="mapa-sat" class="mapa-box"></div>'+
    '<div class="det" style="margin-top:8px">Pontos de referência verificados em 30/09/2026 no Google Maps. Não marcam lotes nem o perímetro do loteamento.</div></div>'+
    '<div class="cartao" style="margin-top:12px"><h3>Planta de referência</h3>'+
    '<div class="chips" id="planta-chips">'+
      MAPA_PLANTAS.map(function(p,i){ return '<button class="chip" data-p="'+i+'">'+esc(p.label)+'</button>'; }).join('')+
    '</div>'+
    '<div id="mapa-planta" class="mapa-box mapa-planta-box"><div class="det" style="padding:24px;text-align:center">Escolha um loteamento acima para abrir a planta com zoom.</div></div>'+
    '<div class="det" style="margin-top:8px">Planta de referência do material recebido do Grupo NB. Não é estoque atual e não representa disponibilidade de lotes.</div></div>';

  mapaSat = L.map('mapa-sat',{attributionControl:true}).setView([-16.71,-49.20], 10);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{
    maxZoom:19, attribution:'Imagens: Esri, Maxar, Earthstar Geographics'
  }).addTo(mapaSat);
  MAPA_PINS.forEach(function(p){
    var m = L.circleMarker([p.lat,p.lng],{radius:9,color:'#c9a84c',weight:2,fillColor:'#c9a84c',fillOpacity:0.9}).addTo(mapaSat);
    m.bindPopup('<b>'+esc(p.nome)+'</b><br>'+esc(p.cidade)+'<br><span style="color:#888">'+esc(p.end)+'</span><br><a href="#/tabelas" data-bundle="'+p.bundle+'" class="pop-tabela">Ver tabela novembro/2026</a>');
  });
  document.getElementById('mapa-sat').addEventListener('click',function(e){
    var a = e.target.closest ? e.target.closest('.pop-tabela') : null;
    if(a){ e.preventDefault(); irParaTabela(a.getAttribute('data-bundle')); }
  });
  Array.prototype.forEach.call(document.querySelectorAll('#planta-chips .chip'),function(c){
    c.addEventListener('click',function(){
      Array.prototype.forEach.call(document.querySelectorAll('#planta-chips .chip'),function(x){x.classList.remove('ativa');});
      c.classList.add('ativa');
      abrirPlanta(Number(c.getAttribute('data-p')));
    });
  });
}

function abrirPlanta(i){
  var p = MAPA_PLANTAS[i];
  if(mapaPlanta){ mapaPlanta.remove(); mapaPlanta=null; }
  var el = document.getElementById('mapa-planta');
  el.innerHTML = '';
  var im = new Image();
  im.onload = function(){
    mapaPlanta = L.map(el,{crs:L.CRS.Simple, minZoom:-4, maxZoom:3, attributionControl:false, zoomSnap:0.25});
    var b = [[0,0],[im.naturalHeight, im.naturalWidth]];
    L.imageOverlay(p.img, b).addTo(mapaPlanta);
    mapaPlanta.fitBounds(b);
    mapaPlanta.setMaxBounds([[-im.naturalHeight*0.5,-im.naturalWidth*0.5],[im.naturalHeight*1.5, im.naturalWidth*1.5]]);
  };
  im.onerror = function(){ el.innerHTML = '<div class="aviso" style="margin:16px">Não consegui abrir a planta. Verifique a internet.</div>'; };
  im.src = p.img;
}

/* ---------------- FOLLOW-UP ---------------- */
var CHAVE_FU='central-followup-v1';
var ETAPAS=['novo','conversa','visita','proposta','ganho','perdido'];

function carregarFU(){ try{ return JSON.parse(localStorage.getItem(CHAVE_FU))||[]; }catch(e){ return []; } }
function salvarFU(l){ localStorage.setItem(CHAVE_FU,JSON.stringify(l)); }
function empOptions(sel){
  var o = DADOS.bundles.map(function(b){ return '<option'+(sel===rotuloCurto(b)?' selected':'')+'>'+esc(rotuloCurto(b))+'</option>'; }).join('');
  return '<option value="">—</option>'+o+'<option'+(sel==='Outro'?' selected':'')+'>Outro</option>';
}
function renderFollowup(){
  var lista = carregarFU();
  var hoje = hojeISO();
  var deHoje = lista.filter(function(c){ return c.proximo && c.proximo<=hoje && c.etapa!=='ganho' && c.etapa!=='perdido'; });
  var contagem = {};
  lista.forEach(function(c){ contagem[c.etapa]=(contagem[c.etapa]||0)+1; });

  var htmlHoje;
  if(deHoje.length===0){
    htmlHoje='<div class="vazio">Nenhum retorno para hoje. Bom dia de prospecção.</div>';
  }else{
    htmlHoje = deHoje.map(function(c){
      var i = lista.indexOf(c);
      var atraso = c.proximo<hoje;
      return '<div class="cartao"><div class="cliente-topo"><div>'+
        '<h3>'+esc(c.nome)+'<span class="pill '+(atraso?'atraso':'hoje')+'">'+(atraso?'em atraso':'hoje')+'</span></h3>'+
        '<div class="det">'+esc(c.empreendimento||'')+(c.etapa?' · '+esc(c.etapa):'')+(c.nota?' · '+esc(c.nota):'')+'</div></div></div>'+
        '<div class="cliente-acoes">'+
        (c.whatsapp?'<a class="botao meio" target="_blank" rel="noopener" href="'+waLink(c.whatsapp,'Olá '+c.nome+', tudo bem?')+'">Chamar no WhatsApp</a>':'')+
        '<button class="botao meio fantasma" data-radar="'+i+'">🧠 Radar</button>'+
        '<button class="botao meio fantasma" data-feito="'+i+'">Feito</button>'+
        '</div></div>';
    }).join('');
  }

  var htmlLista = lista.map(function(c,i){
    return '<div class="cartao"><div class="cliente-topo"><div>'+
      '<h3>'+esc(c.nome)+'</h3>'+
      '<div class="det">'+esc(c.etapa||'')+(c.empreendimento?' · '+esc(c.empreendimento):'')+(c.proximo?' · retorno '+esc(c.proximo.split('-').reverse().join('/')):'')+'</div>'+
      '</div></div>'+
      '<div class="cliente-acoes">'+
      '<button class="botao meio fantasma" data-radar="'+i+'">🧠 Radar</button>'+
      '<button class="botao meio fantasma" data-editar="'+i+'">Editar</button>'+
      '<button class="botao meio fantasma" data-excluir="'+i+'">Excluir</button>'+
      '</div></div>';
  }).join('');

  app.innerHTML =
    '<h1>Follow-up do corretor</h1>'+
    '<p class="sub">Seus clientes ficam salvos só neste aparelho. Nada é enviado automaticamente — você sempre revisa antes de chamar.</p>'+
    '<div class="etapas">'+ETAPAS.map(function(e){ return '<span class="chip">'+e+(contagem[e]?': '+contagem[e]:'')+'</span>'; }).join('')+'</div>'+
    '<h2>Follow-up de hoje ('+deHoje.length+')</h2>'+htmlHoje+
    '<h2>Novo cliente</h2>'+
    '<div class="cartao">'+
    '<label>Nome</label><input id="f-nome" placeholder="Nome do cliente">'+
    '<label>WhatsApp</label><input id="f-zap" inputmode="tel" placeholder="62 9 9999-9999">'+
    '<label>Empreendimento</label><select id="f-emp">'+empOptions('')+'</select>'+
    '<label>Etapa</label><select id="f-etapa">'+ETAPAS.map(function(e){return '<option>'+e+'</option>';}).join('')+'</select>'+
    '<label>Próximo retorno</label><input id="f-data" type="date">'+
    '<label>Nota</label><input id="f-nota" placeholder="Ex.: quer 250 m² até R$110 mil">'+
    '<div style="height:12px"></div>'+
    '<button class="botao ouro" id="f-add">Salvar cliente</button>'+
    '</div>'+
    '<h2>Todos os clientes ('+lista.length+')</h2>'+
    (lista.length?htmlLista:'<div class="vazio">Nenhum cliente ainda.</div>')+
    '<h2>Backup</h2>'+
    '<div class="cartao"><div class="cliente-acoes">'+
    '<button class="botao meio fantasma" id="f-exp">Baixar backup (JSON)</button>'+
    '<label class="botao meio fantasma" style="margin:0;display:inline-block">Restaurar backup<input id="f-imp" type="file" accept="application/json" style="display:none"></label>'+
    '</div></div>';

  document.getElementById('f-add').addEventListener('click',function(){
    var nome=document.getElementById('f-nome').value.trim();
    if(!nome){ document.getElementById('f-nome').focus(); return; }
    lista.push({ nome:nome,
      whatsapp:document.getElementById('f-zap').value.trim(),
      empreendimento:document.getElementById('f-emp').value,
      etapa:document.getElementById('f-etapa').value,
      proximo:document.getElementById('f-data').value,
      nota:document.getElementById('f-nota').value.trim() });
    salvarFU(lista); renderFollowup();
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-feito]'),function(bt){
    bt.addEventListener('click',function(){
      var c=lista[Number(bt.getAttribute('data-feito'))];
      c.ultimoContato=hojeISO(); c.proximo='';
      salvarFU(lista); renderFollowup();
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-radar]'),function(bt){
    bt.addEventListener('click',function(){
      var c=lista[Number(bt.getAttribute('data-radar'))];
      try{ sessionStorage.setItem(CHAVE_RD_PRE, JSON.stringify({nome:c.nome, nota:c.nota||''})); }catch(e){}
      location.hash='#/radar';
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-excluir]'),function(bt){
    bt.addEventListener('click',function(){
      lista.splice(Number(bt.getAttribute('data-excluir')),1);
      salvarFU(lista); renderFollowup();
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-editar]'),function(bt){
    bt.addEventListener('click',function(){
      var c=lista[Number(bt.getAttribute('data-editar'))];
      renderFollowup();
      document.getElementById('f-nome').value=c.nome;
      document.getElementById('f-zap').value=c.whatsapp;
      document.getElementById('f-nota').value=c.nota||'';
      document.getElementById('f-data').value=c.proximo||'';
      var emp=document.getElementById('f-emp');
      for(var i=0;i<emp.options.length;i++){ if(emp.options[i].text===c.empreendimento){ emp.selectedIndex=i; break; } }
      document.getElementById('f-etapa').value=c.etapa||'novo';
      lista.splice(lista.indexOf(c),1); salvarFU(lista);
      window.scrollTo(0,document.getElementById('f-nome').offsetTop-120);
      document.getElementById('f-nome').focus();
    });
  });
  document.getElementById('f-exp').addEventListener('click',function(){
    var blob=new Blob([JSON.stringify(carregarFU(),null,2)],{type:'application/json'});
    var a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download='followup-central-'+hojeISO()+'.json'; a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); },2000);
  });
  document.getElementById('f-imp').addEventListener('change',function(e){
    var f=e.target.files[0]; if(!f) return;
    var rd=new FileReader();
    rd.onload=function(){
      try{ var d=JSON.parse(rd.result); if(Array.isArray(d)){ salvarFU(d); renderFollowup(); } }catch(err){}
    };
    rd.readAsText(f);
  });
}

/* ---------------- COMISSÃO ---------------- */
var CHAVE_CO='central-comissao-v2';
var PADRAO_PCT='2,5'; /* informado pelo Junio em 19/11/2026, sem fonte oficial da NB */
function carregarCO(){ try{ return JSON.parse(localStorage.getItem(CHAVE_CO))||{presets:{}}; }catch(e){ return {presets:{}}; } }
function salvarCO(o){ localStorage.setItem(CHAVE_CO,JSON.stringify(o)); }

function renderComissao(){
  var cfg = carregarCO();
  if(!cfg.presets) cfg.presets={};
  var selEmp = cfg.selEmp||'padrao';
  var preset = cfg.presets[selEmp]||{};
  app.innerHTML =
    '<h1>Calculadora de comissão</h1>'+
    '<div class="aviso">O percentual inicial de <strong>2,5%</strong> foi informado pelo Junio em 19/11/2026 e ainda <strong>não tem confirmação oficial da loteadora (NB)</strong>. Edite os campos se a regra for outra; dá para salvar percentuais diferentes por loteamento.</div>'+
    '<div class="cartao">'+
    '<label>Loteamento (regra salva por loteamento)</label><select id="c-emp"><option value="padrao">Padrão (todos)</option>'+DADOS.bundles.map(function(b){return '<option value="'+b.id+'"'+(selEmp===b.id?' selected':'')+'>'+esc(rotuloCurto(b))+'</option>';}).join('')+'</select>'+
    '<label>Valor de venda (R$)</label><input id="c-valor" inputmode="decimal" placeholder="Ex.: 199568,40" value="'+esc(cfg.valor||'')+'">'+
    '<div class="dois"><div><label>% comissão total</label><input id="c-total" inputmode="decimal" placeholder="2,5" value="'+esc(preset.total||PADRAO_PCT)+'"></div>'+
    '<div><label>% pago no ato</label><input id="c-ato" inputmode="decimal" placeholder="opcional" value="'+esc(preset.ato||'')+'"></div></div>'+
    '<label>Restante em quantas parcelas?</label><input id="c-parc" inputmode="numeric" placeholder="opcional" value="'+esc(preset.parc||'')+'">'+
    '<div style="height:12px"></div>'+
    '<button class="botao ouro" id="c-calc">Calcular</button>'+
    '<div style="height:8px"></div>'+
    '<button class="botao fantasma" id="c-save">Salvar percentuais para este loteamento</button>'+
    '</div>'+
    '<div id="c-res"></div>'+
    '<h2>Buscar valor de um lote (tabela novembro/2026)</h2>'+
    '<div class="cartao">'+
    '<label>Loteamento</label><select id="c-bund">'+DADOS.bundles.map(function(b){return '<option value="'+b.id+'">'+esc(rotuloCurto(b))+'</option>';}).join('')+'</select>'+
    '<div class="dois"><div><label>Quadra</label><input id="c-q" inputmode="text" placeholder="7"></div>'+
    '<div><label>Lote</label><input id="c-l" inputmode="text" placeholder="4"></div></div>'+
    '<div style="height:12px"></div>'+
    '<button class="botao" id="c-busca">Usar valor à vista deste lote</button>'+
    '<div id="c-busca-msg" class="det" style="margin-top:8px"></div>'+
    '</div>';

  function parseBR(s){ return num(String(s||'').replace(/\./g,'').replace(',','.')); }
  function calc(){
    var v=parseBR(document.getElementById('c-valor').value);
    var t=parseBR(document.getElementById('c-total').value);
    var a=parseBR(document.getElementById('c-ato').value);
    var p=parseInt(document.getElementById('c-parc').value,10)||0;
    cfg.valor=document.getElementById('c-valor').value; salvarCO(cfg);
    var res=document.getElementById('c-res');
    if(!v||!t){ res.innerHTML='<div class="aviso">Preencha o valor de venda e o % de comissão total.</div>'; return; }
    var comT=v*t/100, comA=a?v*a/100:0, resto=comT-comA;
    var dl='<dt>Comissão total</dt><dd>'+brl(comT)+'</dd>';
    if(comA>0) dl+='<dt>No ato</dt><dd>'+brl(comA)+'</dd>';
    if(comA>0&&p>0) dl+='<dt>Restante em '+p+'x</dt><dd>'+brl(resto/p)+' /mês</dd>';
    else if(comA>0) dl+='<dt>Restante</dt><dd>'+brl(resto)+'</dd>';
    res.innerHTML='<div class="resultado"><div class="grande">'+brl(comT)+'</div><dl>'+dl+'</dl>'+
      '<p class="det" style="margin-top:10px;font-size:12px;color:var(--suave)">Simulação com percentuais editáveis. O 2,5% inicial foi informado pelo Junio, sem fonte oficial da NB — confirme a regra com a loteadora antes da proposta.</p></div>';
  }
  document.getElementById('c-calc').addEventListener('click',calc);
  document.getElementById('c-save').addEventListener('click',function(){
    var emp=document.getElementById('c-emp').value;
    cfg.presets[emp]={ total:document.getElementById('c-total').value, ato:document.getElementById('c-ato').value, parc:document.getElementById('c-parc').value };
    cfg.selEmp=emp; salvarCO(cfg);
    this.textContent='Salvo ✓'; var bt=this; setTimeout(function(){ bt.textContent='Salvar percentuais para este loteamento'; },1500);
  });
  document.getElementById('c-emp').addEventListener('change',function(){
    cfg.selEmp=document.getElementById('c-emp').value;
    cfg.valor=document.getElementById('c-valor').value; salvarCO(cfg);
    renderComissao();
  });
  document.getElementById('c-busca').addEventListener('click',function(){
    var bid=document.getElementById('c-bund').value;
    var q=document.getElementById('c-q').value.trim().toLowerCase();
    var l=document.getElementById('c-l').value.trim().toLowerCase();
    var b=DADOS.bundles.filter(function(x){return x.id===bid;})[0];
    var r=b.rows.filter(function(x){ return String(x.quadra).toLowerCase()===q && String(x.lote).toLowerCase()===l; })[0];
    var msg=document.getElementById('c-busca-msg');
    if(r){
      document.getElementById('c-valor').value = Number(r.cash_value_brl).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
      msg.textContent='Q'+r.quadra+' L'+r.lote+' — '+brl(r.cash_value_brl)+' (tabela '+b.month+').';
      calc();
    }else{
      msg.textContent='Lote não encontrado nesta tabela. Confira quadra e lote.';
    }
  });
  calc();
}

/* ---------------- RADAR DE LOTES ---------------- */
var CHAVE_RD_PRE='central-radar-prefill';

function prefillRadarDoCliente(){
  try{
    var raw=sessionStorage.getItem(CHAVE_RD_PRE);
    if(!raw) return null;
    sessionStorage.removeItem(CHAVE_RD_PRE);
    return JSON.parse(raw);
  }catch(e){ return null; }
}

function extraiPerfil(nota){
  var p={max:'',areaMin:''};
  var t=String(nota||'');
  var mA=t.match(/(\d[\d\.,]*)\s*m\u00B2/i);
  if(mA) p.areaMin=mA[1];
  var mR=t.match(/r\$\s*([\d\.,]+)\s*(mil)?/i);
  if(mR){
    var v=parseNumBR(mR[1]);
    if(mR[2] && v<10000) v=v*1000;
    if(v>0) p.max=String(v).replace('.',',');
  }else{
    var mM=t.match(/(\d+)\s*mil/i);
    if(mM){ var v2=Number(mM[1])*1000; if(v2>=10000) p.max=String(v2); }
  }
  return p;
}

function radarMatch(perfil){
  var max=parseNumBR(perfil.max), aMin=parseNumBR(perfil.areaMin);
  var out=[];
  DADOS.bundles.forEach(function(b){
    if(perfil.bund && perfil.bund!=='all' && b.id!==perfil.bund) return;
    b.rows.forEach(function(r){
      var preco=num(r.cash_value_brl), area=num(r.area_m2);
      if(max>0 && preco>max) return;
      if(aMin>0 && area<aMin) return;
      out.push({b:b,r:r,m2:area>0?preco/area:Infinity});
    });
  });
  out.sort(function(x,y){ return x.m2-y.m2; });
  return out;
}

function renderRadar(){
  var pre=prefillRadarDoCliente()||{};
  var perfil=Object.assign({nome:'',max:'',areaMin:'',bund:'all'}, pre.campos||extraiPerfil(pre.nota||''));
  if(pre.nome) perfil.nome=pre.nome;
  if(pre.campos==null && pre.nota && pre.nome==null) perfil.nome='';

  function desenha(){
    var lista=radarMatch(perfil);
    var top=lista.slice(0,8);
    var linhas=top.map(function(it,i){
      var r=it.r;
      return '<div class="linha-lote" data-rd="'+i+'">'+
        '<div><div class="ql">Q'+esc(r.quadra)+' · L'+esc(r.lote)+(r.stage?' <span class="info">'+esc(r.stage)+'</span>':'')+'</div>'+
        '<div class="info">'+esc(rotuloCurto(it.b))+' · '+esc(r.area_m2)+' m² · <span class="por-m2">'+brl(it.m2)+'/m²</span></div></div>'+
        '<div class="valor">'+brl(r.cash_value_brl)+'</div></div>';
    }).join('');
    var resumo = perfil.nome ? 'Para <strong>'+esc(perfil.nome)+'</strong>: ' : '';
    app.innerHTML =
      '<h1>Radar de Lotes</h1>'+
      '<div class="radar-heroi"><div class="titulo">🧠 Qual lote oferecer para cada cliente?</div>'+
      '<div class="det" style="color:var(--suave);font-size:13px">Diga o perfil e o Radar cruza com as 662 tabelas oficiais de novembro, ordenando pelo melhor preço por m².</div></div>'+
      '<div class="cartao">'+
      '<label>Nome do cliente (opcional)</label><input id="r-nome" placeholder="Ex.: João" value="'+esc(perfil.nome||'')+'">'+
      '<div class="dois"><div><label>Preço máximo (R$)</label><input id="r-max" inputmode="decimal" placeholder="Ex.: 110000" value="'+esc(perfil.max||'')+'"></div>'+
      '<div><label>Área mínima (m²)</label><input id="r-area" inputmode="decimal" placeholder="Ex.: 250" value="'+esc(perfil.areaMin||'')+'"></div></div>'+
      '<label>Loteamento</label><select id="r-bund"><option value="all">Todos</option>'+DADOS.bundles.map(function(b){return '<option value="'+b.id+'"'+(perfil.bund===b.id?' selected':'')+'>'+esc(rotuloCurto(b))+'</option>';}).join('')+'</select>'+
      '<div style="height:12px"></div>'+
      '<button class="botao ouro" id="r-go">Rodar o Radar</button>'+
      '</div>'+
      '<h2>'+(top.length? resumo+top.length+' lote'+(top.length>1?'s':'')+' encontrado'+(top.length>1?'s':''):'Nenhum lote nesse perfil')+'</h2>'+
      linhas+
      (top.length? '<div style="height:8px"></div><button class="botao" id="r-share">Enviar seleção no WhatsApp</button>':'')+
      '<div class="vazio" style="padding-top:14px">Valores à vista das tabelas oficiais novembro/2026. Disponibilidade sob confirmação.</div>';

    function relê(){
      perfil.nome=document.getElementById('r-nome').value.trim();
      perfil.max=document.getElementById('r-max').value;
      perfil.areaMin=document.getElementById('r-area').value;
      perfil.bund=document.getElementById('r-bund').value;
    }
    document.getElementById('r-go').addEventListener('click',function(){ relê(); desenha(); });
    document.getElementById('r-bund').addEventListener('change',function(){ relê(); desenha(); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-rd]'),function(el){
      el.addEventListener('click',function(){
        var it=top[Number(el.getAttribute('data-rd'))];
        abrirFicha(it.b,it.r);
      });
    });
    var sh=document.getElementById('r-share');
    if(sh) sh.addEventListener('click',function(){
      var nome=document.getElementById('r-nome').value.trim();
      var txt='Oi'+(nome?' '+nome:'')+', separei estes lotes para você:\n\n'+
        top.slice(0,3).map(function(it){ return fichaTexto(it.b,it.r); }).join('\n\n—\n\n')+
        '\n\nPosso te mandar mais opções ou agendar uma visita?';
      window.open(waLink('',txt),'_blank');
    });
  }
  desenha();
}


/* ---------------- POST DO LOTE DO DIA ---------------- */
var postSel = {bundle:null, idx:-1};

function loteDoDiaAuto(){
  var lista = radarMatch({});
  var top = lista.slice(0,20);
  if(!top.length) return null;
  var hoje = new Date();
  var diaAno = Math.floor((hoje - new Date(hoje.getFullYear(),0,0))/864e5);
  return top[diaAno % top.length];
}

function desenhaPost(cv, b, r){
  var W=1080, H=1350; cv.width=W; cv.height=H;
  var x = cv.getContext('2d');
  var g = x.createLinearGradient(0,0,W,H);
  g.addColorStop(0,'#fdfaf6'); g.addColorStop(.55,'#f8f1e8'); g.addColorStop(1,'#f5e9dc');
  x.fillStyle=g; x.fillRect(0,0,W,H);
  x.strokeStyle='#b8912f'; x.lineWidth=3; x.strokeRect(28,28,W-56,H-56);
  function centro(t,y,fonte,cor){ x.font=fonte; x.fillStyle=cor; x.textAlign='center'; x.fillText(t,W/2,y); }
  try{ x.letterSpacing='10px'; }catch(e){}
  centro('INVESTE CANEDO',110,'700 44px -apple-system, "Segoe UI", Arial','#8a6d1f');
  try{ x.letterSpacing='4px'; }catch(e){}
  var hoje=new Date();
  var dataBR=String(hoje.getDate()).padStart(2,'0')+'/'+String(hoje.getMonth()+1).padStart(2,'0')+'/'+hoje.getFullYear();
  centro('LOTE DO DIA · '+dataBR,168,'600 30px -apple-system, "Segoe UI", Arial','#716a5a');
  try{ x.letterSpacing='0px'; }catch(e){}
  function rr(px,py,pw,ph,rad){ x.beginPath(); x.moveTo(px+rad,py); x.arcTo(px+pw,py,px+pw,py+ph,rad); x.arcTo(px+pw,py+ph,px,py+ph,rad); x.arcTo(px,py+ph,px,py,rad); x.arcTo(px,py,px+pw,py,rad); x.closePath(); }
  x.save(); x.shadowColor='rgba(120,90,50,.25)'; x.shadowBlur=40; x.shadowOffsetY=12;
  rr(90,230,W-180,840,36); x.fillStyle='#ffffff'; x.fill(); x.restore();
  rr(90,230,W-180,840,36); x.strokeStyle='#e9e2d2'; x.lineWidth=2; x.stroke();
  var nome = b.label.replace(/\s*·\s*novembro\/2026.*$/,'').replace(/\s*·\s*/g,' · ');
  centro(nome.toUpperCase(),330,'700 34px -apple-system, "Segoe UI", Arial','#8a6d1f');
  var qlTxt='QUADRA '+r.quadra+' · LOTE '+r.lote, qlSize=96;
  x.font='800 '+qlSize+'px -apple-system, "Segoe UI", Arial';
  while(x.measureText(qlTxt).width > W-260 && qlSize>40){ qlSize-=4; x.font='800 '+qlSize+'px -apple-system, "Segoe UI", Arial'; }
  centro(qlTxt,470,'800 '+qlSize+'px -apple-system, "Segoe UI", Arial','#26221a');
  centro(num(r.area_m2).toLocaleString('pt-BR')+' m²',545,'600 44px -apple-system, "Segoe UI", Arial','#716a5a');
  x.strokeStyle='#e9e2d2'; x.lineWidth=2; x.beginPath(); x.moveTo(190,610); x.lineTo(W-190,610); x.stroke();
  centro('À VISTA',680,'600 30px -apple-system, "Segoe UI", Arial','#716a5a');
  var vTxt=brl(r.cash_value_brl), vSize=88;
  x.font='800 '+vSize+'px -apple-system, "Segoe UI", Arial';
  while(x.measureText(vTxt).width > W-300 && vSize>36){ vSize-=4; x.font='800 '+vSize+'px -apple-system, "Segoe UI", Arial'; }
  centro(vTxt,790,'800 '+vSize+'px -apple-system, "Segoe UI", Arial','#b8912f');
  var area=num(r.area_m2), preco=num(r.cash_value_brl);
  if(area>0) centro(brl(preco/area)+' por m²',860,'600 36px -apple-system, "Segoe UI", Arial','#8a6d1f');
  if(num(r.discount_brl)>0){
    rr(W/2-260,905,520,72,36); x.fillStyle='#eaf8ef'; x.fill(); x.strokeStyle='#b9e2c6'; x.lineWidth=2; x.stroke();
    centro('DESCONTO DE '+brl(r.discount_brl),952,'700 30px -apple-system, "Segoe UI", Arial','#1f6b3a');
  }
  centro('Disponibilidade sob confirmação · Tabela '+(b.month||'novembro/2026'),1180,'500 28px -apple-system, "Segoe UI", Arial','#716a5a');
  centro('WhatsApp (62) 98216-5619',1236,'700 34px -apple-system, "Segoe UI", Arial','#26221a');
}

function renderPost(){
  var auto = postSel.idx<0 ? loteDoDiaAuto() : null;
  var bAtual = auto ? auto.b : DADOS.bundles.filter(function(b){return b.id===postSel.bundle;})[0];
  if(!bAtual) bAtual = DADOS.bundles[0];
  var rows = bAtual.rows.map(function(r){ return {r:r, m2:num(r.area_m2)>0?num(r.cash_value_brl)/num(r.area_m2):Infinity}; })
    .sort(function(a,b2){return a.m2-b2.m2;});
  if(auto){
    var ai=0; rows.forEach(function(it,i){ if(it.r===auto.r) ai=i; });
    postSel={bundle:bAtual.id, idx:ai};
  }
  var rAtual = (rows[postSel.idx]||rows[0]).r;
  app.innerHTML =
    '<h1>Post do lote do dia</h1>'+
    '<p class="sub">Imagem pronta com a sua marca para postar ou mandar no WhatsApp. Trocar de lote é só escolher abaixo.</p>'+
    '<div class="chips">'+
      DADOS.bundles.map(function(b){ return '<button class="chip'+(b.id===bAtual.id?' ativa':'')+'" data-pb="'+b.id+'">'+esc(rotuloCurto(b))+'</button>'; }).join('')+
    '</div>'+
    '<select id="post-lote">'+
      rows.map(function(it,i){ return '<option value="'+i+'"'+(((rows[postSel.idx]||rows[0]).r===it.r)?' selected':'')+'>Q'+it.r.quadra+' L'+it.r.lote+' · '+num(it.r.area_m2).toLocaleString('pt-BR')+' m² · '+brl(it.r.cash_value_brl)+'</option>'; }).join('')+
    '</select>'+
    '<div style="height:10px"></div>'+
    '<button class="botao fantasma" id="post-auto">🎲 Lote do dia de hoje (melhor R$/m²)</button>'+
    '<div class="cartao" style="margin-top:14px;padding:10px"><canvas id="post-cv" style="width:100%;border-radius:10px;display:block"></canvas></div>'+
    '<div class="dois">'+
      '<div><button class="botao ouro" id="post-baixar">⬇️ Baixar imagem</button></div>'+
      '<div><button class="botao" id="post-share">📤 Compartilhar</button></div>'+
    '</div>'+
    '<div class="aviso" style="margin-top:12px">A imagem sai com valor da tabela novembro/2026 e aviso de disponibilidade sob confirmação. Confira o lote antes de postar.</div>';
  var cv=document.getElementById('post-cv');
  desenhaPost(cv,bAtual,rAtual);
  Array.prototype.forEach.call(document.querySelectorAll('[data-pb]'),function(c){
    c.addEventListener('click',function(){ postSel={bundle:c.getAttribute('data-pb'),idx:0}; renderPost(); });
  });
  document.getElementById('post-lote').addEventListener('change',function(e){ postSel={bundle:bAtual.id,idx:Number(e.target.value)}; renderPost(); });
  document.getElementById('post-auto').addEventListener('click',function(){ postSel={bundle:null,idx:-1}; renderPost(); });
  function texto(){ return fichaTexto(bAtual,rAtual)+'\n\nMe chama aqui no WhatsApp para garantir: (62) 98216-5619'; }
  document.getElementById('post-baixar').addEventListener('click',function(){
    cv.toBlob(function(blob){
      var a=document.createElement('a'); a.href=URL.createObjectURL(blob);
      a.download='lote-do-dia-q'+rAtual.quadra+'-l'+rAtual.lote+'.png'; a.click();
      setTimeout(function(){URL.revokeObjectURL(a.href);},4000);
    },'image/png');
  });
  document.getElementById('post-share').addEventListener('click',function(){
    cv.toBlob(function(blob){
      var file=new File([blob],'lote-do-dia.png',{type:'image/png'});
      if(navigator.canShare && navigator.canShare({files:[file]})){
        navigator.share({files:[file],title:'Lote do dia',text:texto()}).catch(function(){});
      }else{
        var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='lote-do-dia.png'; a.click();
        window.open(waLink('',texto()),'_blank');
      }
    },'image/png');
  });
}


/* ---------------- PAINEL DE MERCADO ---------------- */
var painelOrd = 'm2';

function statsBundle(b){
  var rows=b.rows.map(function(r){ return {r:r, preco:num(r.cash_value_brl), area:num(r.area_m2), desc:num(r.discount_brl)}; })
    .filter(function(it){ return it.preco>0 && it.area>0; });
  if(!rows.length) return null;
  var m2=rows.map(function(it){return it.preco/it.area;});
  var iMenor=0, iMaior=0, iBarato=0, iDesc=0;
  rows.forEach(function(it,i){
    if(m2[i]<m2[iMenor]) iMenor=i;
    if(m2[i]>m2[iMaior]) iMaior=i;
    if(it.preco<rows[iBarato].preco) iBarato=i;
    if(it.desc>rows[iDesc].desc) iDesc=i;
  });
  var areas=rows.map(function(it){return it.area;});
  var ticket=rows.reduce(function(a,it){return a+it.preco;},0)/rows.length;
  return {b:b, n:rows.length,
    areaMin:Math.min.apply(null,areas), areaMax:Math.max.apply(null,areas),
    m2Min:m2[iMenor], m2Max:m2[iMaior], ticket:ticket,
    melhor:rows[iMenor], barato:rows[iBarato], desconto:rows[iDesc]};
}

function renderPainel(){
  var stats=DADOS.bundles.map(statsBundle).filter(Boolean);
  var ordFns={
    m2:function(a,b){return a.m2Min-b.m2Min;},
    preco:function(a,b){return a.barato.preco-b.barato.preco;},
    ticket:function(a,b){return a.ticket-b.ticket;},
    desconto:function(a,b){return b.desconto.desc-a.desconto.desc;}
  };
  stats.sort(ordFns[painelOrd]||ordFns.m2);
  var todos=[]; DADOS.bundles.forEach(function(b){ b.rows.forEach(function(r){ var p=num(r.cash_value_brl),a=num(r.area_m2); if(p>0&&a>0) todos.push({b:b,r:r,m2:p/a,preco:p,desc:num(r.discount_brl)}); }); });
  var menorM2=todos.reduce(function(m,it){return it.m2<m.m2?it:m;},todos[0]);
  var maiorDesc=todos.reduce(function(m,it){return it.desc>m.desc?it:m;},todos[0]);
  var ticketGeral=todos.reduce(function(a,it){return a+it.preco;},0)/todos.length;
  app.innerHTML =
    '<h1>Painel de mercado</h1>'+
    '<p class="sub">Radiografia das tabelas oficiais de novembro/2026. Tudo calculado dos PDFs recebidos da loteadora.</p>'+
    '<div class="grade3">'+
      '<div class="cartao"><div class="det">Lotes nas tabelas</div><div style="font-size:26px;font-weight:800">'+todos.length+'</div><div class="det">'+DADOS.bundles.length+' loteamentos</div></div>'+
      '<div class="cartao"><div class="det">Melhor R$/m²</div><div style="font-size:26px;font-weight:800;color:var(--bronze)">'+brl(menorM2.m2)+'</div><div class="det">'+esc(rotuloCurto(menorM2.b))+' · Q'+menorM2.r.quadra+' L'+menorM2.r.lote+'</div></div>'+
      '<div class="cartao"><div class="det">Ticket médio à vista</div><div style="font-size:26px;font-weight:800">'+brl(ticketGeral)+'</div><div class="det">considerando todos os lotes</div></div>'+
      (maiorDesc.desc>0 ? '<div class="cartao"><div class="det">Maior desconto</div><div style="font-size:26px;font-weight:800;color:#1f6b3a">'+brl(maiorDesc.desc)+'</div><div class="det">'+esc(rotuloCurto(maiorDesc.b))+' · Q'+maiorDesc.r.quadra+' L'+maiorDesc.r.lote+'</div></div>' : '')+
    '</div>'+
    '<h2>Ordenar por</h2>'+
    '<div class="chips">'+
      '<button class="chip'+(painelOrd==='m2'?' ativa':'')+'" data-ord="m2">Melhor R$/m²</button>'+
      '<button class="chip'+(painelOrd==='preco'?' ativa':'')+'" data-ord="preco">Menor valor</button>'+
      '<button class="chip'+(painelOrd==='ticket'?' ativa':'')+'" data-ord="ticket">Menor ticket médio</button>'+
      '<button class="chip'+(painelOrd==='desconto'?' ativa':'')+'" data-ord="desconto">Maior desconto</button>'+
    '</div>'+
    stats.map(function(st,i){
      return '<div class="cartao">'+
        '<div class="cliente-topo"><h3>'+(i+1)+'º · '+esc(rotuloCurto(st.b))+'</h3><span class="pill hoje">'+st.n+' lotes</span></div>'+
        '<div class="det" style="margin:6px 0 10px">Áreas de '+st.areaMin.toLocaleString('pt-BR')+' a '+st.areaMax.toLocaleString('pt-BR')+' m² · ticket médio '+brl(st.ticket)+'</div>'+
        '<div class="dois">'+
          '<div><div class="det">Melhor R$/m²</div><div style="font-weight:800;color:var(--bronze)">'+brl(st.m2Min)+'/m²</div><div class="det">Q'+st.melhor.r.quadra+' L'+st.melhor.r.lote+' · '+brl(st.melhor.preco)+'</div></div>'+
          '<div><div class="det">Menor valor à vista</div><div style="font-weight:800">'+brl(st.barato.preco)+'</div><div class="det">Q'+st.barato.r.quadra+' L'+st.barato.r.lote+' · '+st.barato.area.toLocaleString('pt-BR')+' m²</div></div>'+
        '</div>'+
        (st.desconto.desc>0 ? '<div class="det" style="margin-top:8px;color:#1f6b3a;font-weight:600">Maior desconto: '+brl(st.desconto.desc)+' (Q'+st.desconto.r.quadra+' L'+st.desconto.r.lote+')</div>' : '')+
        '<div style="margin-top:10px"><button class="botao fantasma meio" data-ver="'+st.b.id+'">Ver tabela</button></div>'+
      '</div>';
    }).join('')+
    '<div class="aviso verde">Leitura interna para você argumentar com o cliente. Os valores são das tabelas novembro/2026; disponibilidade sempre sob confirmação.</div>';
  Array.prototype.forEach.call(document.querySelectorAll('[data-ord]'),function(c){
    c.addEventListener('click',function(){ painelOrd=c.getAttribute('data-ord'); renderPainel(); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-ver]'),function(c){
    c.addEventListener('click',function(){ irParaTabela(c.getAttribute('data-ver')); });
  });
}

/* ---------------- HOME ---------------- */
function renderHome(){
  var total = DADOS.bundles.reduce(function(a,b){return a+b.rows.length;},0);
  app.innerHTML =
    '<h1>Central do Corretor</h1>'+
    '<p class="sub">Tabelas, follow-up e comissão em um só lugar. Feito para o corretor vender no celular.</p>'+
    '<div class="grade3">'+
    '<div class="cartao cartao-toque" data-go="radar"><h3>🧠 Radar</h3><div class="det">Qual lote oferecer para cada cliente, pelo melhor preço por m²</div></div>'+
    '<div class="cartao cartao-toque" data-go="mapa"><h3>🗺️ Mapa</h3><div class="det">Satélite com os loteamentos e planta com zoom para mostrar ao cliente</div></div>'+
    '<div class="cartao cartao-toque" data-go="post"><h3>📣 Post do dia</h3><div class="det">Imagem pronta do lote em destaque para você postar</div></div>'+
    '<div class="cartao cartao-toque" data-go="tabelas"><h3>📋 Tabelas</h3><div class="det">'+DADOS.bundles.length+' loteamentos · '+total+' lotes · tabelas novembro/2026</div></div>'+
    '<div class="cartao cartao-toque" data-go="followup"><h3>📞 Follow-up</h3><div class="det">Quem chamar hoje, com link direto pro WhatsApp</div></div>'+
    '<div class="cartao cartao-toque" data-go="painel"><h3>📊 Painel</h3><div class="det">Raio-x das tabelas: melhor R$/m², menor valor, maiores descontos</div></div>'+
    '<div class="cartao cartao-toque" data-go="comissao"><h3>🧮 Comissão</h3><div class="det">Quanto você ganha por venda, do seu jeito</div></div>'+
    '</div>'+
    '<div class="aviso verde" style="margin-top:14px">Versão de testes para apresentação. Os dados das tabelas vêm dos PDFs oficiais recebidos da loteadora; a disponibilidade de cada lote é confirmada na hora da venda.</div>';
  Array.prototype.forEach.call(document.querySelectorAll('[data-go]'),function(c){
    c.addEventListener('click',function(){ location.hash='#/'+c.getAttribute('data-go'); });
  });
}

function rota(){
  fecharFicha();
  var h=(location.hash||'#/').replace('#/','');
  var nome=(h||'home').split('?')[0];
  Array.prototype.forEach.call(document.querySelectorAll('#abas a'),function(a){
    a.classList.toggle('ativa', a.getAttribute('data-rota')===nome);
  });
  if(nome==='tabelas') renderTabelas();
  else if(nome==='mapa') renderMapa();
  else if(nome==='post') renderPost();
  else if(nome==='painel') renderPainel();
  else if(nome==='radar') renderRadar();
  else if(nome==='followup') renderFollowup();
  else if(nome==='comissao') renderComissao();
  else renderHome();
  window.scrollTo(0,0);
}
window.addEventListener('hashchange',rota);
rota();
})();
