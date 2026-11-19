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

/* ---------------- HOME ---------------- */
function renderHome(){
  var total = DADOS.bundles.reduce(function(a,b){return a+b.rows.length;},0);
  app.innerHTML =
    '<h1>Central do Corretor</h1>'+
    '<p class="sub">Tabelas, follow-up e comissão em um só lugar. Feito para o corretor vender no celular.</p>'+
    '<div class="grade3">'+
    '<div class="cartao cartao-toque" data-go="radar"><h3>🧠 Radar</h3><div class="det">Qual lote oferecer para cada cliente, pelo melhor preço por m²</div></div>'+
    '<div class="cartao cartao-toque" data-go="mapa"><h3>🗺️ Mapa</h3><div class="det">Satélite com os loteamentos e planta com zoom para mostrar ao cliente</div></div>'+
    '<div class="cartao cartao-toque" data-go="tabelas"><h3>📋 Tabelas</h3><div class="det">'+DADOS.bundles.length+' loteamentos · '+total+' lotes · tabelas novembro/2026</div></div>'+
    '<div class="cartao cartao-toque" data-go="followup"><h3>📞 Follow-up</h3><div class="det">Quem chamar hoje, com link direto pro WhatsApp</div></div>'+
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
  else if(nome==='radar') renderRadar();
  else if(nome==='followup') renderFollowup();
  else if(nome==='comissao') renderComissao();
  else renderHome();
  window.scrollTo(0,0);
}
window.addEventListener('hashchange',rota);
rota();
})();
