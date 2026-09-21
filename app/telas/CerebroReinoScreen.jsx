/* CerebroReinoScreen.jsx — Grafo 3D do schema do banco Reino
   Dependências: three.js (UMD → window.THREE), 3d-force-graph (UMD → window.ForceGraph3D)
   Estilos: estilos/cerebro-reino.css */
/* global React, THREE, ForceGraph3D */

// ======================== cores por tipo de dado ========================
const TIPO_COR = {
  uuid: '#3fe3ff',      // ciano
  text: '#3b82ff',       // azul
  timestamptz: '#ffb547', // âmbar
  integer: '#34e6a6',    // verde
  boolean: '#e04bff',    // magenta
  jsonb: '#8b5cff',      // violeta
  numeric: '#f5c76a',    // ouro
  'char(2)': '#ff4d7a',  // vermelho
  'text[]': '#3b82ff',   // azul (array)
  out: '#8d9bc4',        // cinza
};

function corTipo(tipo) {
  if (!tipo) return TIPO_COR.out;
  const t = tipo.toLowerCase();
  if (t.includes('uuid')) return TIPO_COR.uuid;
  if (t.includes('text') && t.includes('[]')) return TIPO_COR['text[]'];
  if (t === 'text') return TIPO_COR.text;
  if (t.includes('timestamp')) return TIPO_COR.timestamptz;
  if (t.includes('int')) return TIPO_COR.integer;
  if (t.includes('bool')) return TIPO_COR.boolean;
  if (t.includes('json')) return TIPO_COR.jsonb;
  if (t.includes('numeric') || t.includes('double')) return TIPO_COR.numeric;
  if (t.includes('char')) return TIPO_COR['char(2)'];
  return TIPO_COR.out;
}

// ======================== schema do banco ========================
const SCHEMA = {
  tables: [
    {
      name: 'auth.users',
      desc: 'Tabela central de autenticação (Supabase Auth)',
      columns: [
        { name: 'id', type: 'uuid', pk: true },
        { name: 'email', type: 'text' },
        { name: 'created_at', type: 'timestamptz' },
      ],
    },
    {
      name: 'perfis',
      desc: 'Perfis dos usuários (1:1 com auth.users via trigger)',
      columns: [
        { name: 'id', type: 'uuid', pk: true, fk: 'auth.users.id' },
        { name: 'nome', type: 'text' },
        { name: 'email', type: 'text' },
        { name: 'titulo', type: 'text' },
        { name: 'cidade', type: 'text' },
        { name: 'uf', type: 'text' },
        { name: 'situacao', type: 'text' },
        { name: 'foto', type: 'text' },
        { name: 'usuario', type: 'text' },
        { name: 'empresa', type: 'text' },
        { name: 'cnpj', type: 'text' },
        { name: 'criado_em', type: 'timestamptz' },
      ],
    },
    {
      name: 'cadastros',
      desc: 'Registros de novos usuários via link de afiliado',
      columns: [
        { name: 'id', type: 'uuid', pk: true },
        { name: 'codigo', type: 'text' },
        { name: 'visita_id', type: 'uuid', fk: 'cliques.id' },
        { name: 'nome', type: 'text' },
        { name: 'email', type: 'text' },
        { name: 'titulo', type: 'text' },
        { name: 'cidade', type: 'text' },
        { name: 'uf', type: 'text' },
        { name: 'criado_em', type: 'timestamptz' },
      ],
    },
    {
      name: 'cliques',
      desc: 'Cliques em links de afiliados',
      columns: [
        { name: 'id', type: 'uuid', pk: true },
        { name: 'codigo', type: 'text' },
        { name: 'dispositivo', type: 'text' },
        { name: 'origem', type: 'text' },
        { name: 'cadastrou', type: 'boolean' },
        { name: 'cidade', type: 'text' },
        { name: 'uf', type: 'text' },
        { name: 'criado_em', type: 'timestamptz' },
      ],
    },
    {
      name: 'codigos',
      desc: 'Códigos de afiliado por usuário',
      columns: [
        { name: 'codigo', type: 'text', pk: true },
        { name: 'user_id', type: 'uuid', fk: 'auth.users.id' },
        { name: 'nome', type: 'text' },
        { name: 'criado_em', type: 'timestamptz' },
      ],
    },
    {
      name: 'fotos',
      desc: 'Fotos de perfil armazenadas como data URL',
      columns: [
        { name: 'chave', type: 'text', pk: true },
        { name: 'url', type: 'text' },
        { name: 'dono', type: 'uuid' },
        { name: 'criado_em', type: 'timestamptz' },
      ],
    },
    {
      name: 'academy_trilhas',
      desc: 'Trilhas de aprendizado da Academy',
      columns: [
        { name: 'id', type: 'uuid', pk: true },
        { name: 'titulo', type: 'text' },
        { name: 'descricao', type: 'text' },
        { name: 'capa', type: 'text' },
        { name: 'fonte', type: 'text' },
        { name: 'fonte_id', type: 'text' },
        { name: 'ordem', type: 'integer' },
        { name: 'criado_por', type: 'uuid' },
        { name: 'criado_em', type: 'timestamptz' },
      ],
    },
    {
      name: 'academy_aulas',
      desc: 'Aulas em vídeo da Academy',
      columns: [
        { name: 'id', type: 'uuid', pk: true },
        { name: 'trilha_id', type: 'uuid', fk: 'academy_trilhas.id' },
        { name: 'youtube_id', type: 'text' },
        { name: 'titulo', type: 'text' },
        { name: 'descricao', type: 'text' },
        { name: 'canal', type: 'text' },
        { name: 'nivel', type: 'text' },
        { name: 'ordem', type: 'integer' },
        { name: 'criado_por', type: 'uuid' },
        { name: 'criado_em', type: 'timestamptz' },
      ],
    },
    {
      name: 'empresas_reais',
      desc: 'Empresas reais do Google Maps (somente leitura)',
      columns: [
        { name: 'place_id', type: 'text', pk: true },
        { name: 'cid', type: 'text' },
        { name: 'nome', type: 'text' },
        { name: 'categoria', type: 'text' },
        { name: 'tipos', type: 'text[]' },
        { name: 'endereco', type: 'text' },
        { name: 'bairro', type: 'text' },
        { name: 'cidade', type: 'text' },
        { name: 'uf', type: 'char(2)' },
        { name: 'lat', type: 'numeric' },
        { name: 'lng', type: 'numeric' },
        { name: 'nota', type: 'numeric' },
        { name: 'avaliacoes', type: 'integer' },
        { name: 'telefone', type: 'text' },
        { name: 'site', type: 'text' },
        { name: 'horario', type: 'jsonb' },
        { name: 'foto_url', type: 'text' },
        { name: 'fonte', type: 'text' },
        { name: 'buscado_em', type: 'timestamptz' },
      ],
    },
    {
      name: 'tentativas_login',
      desc: 'Rate limiting de login (schema privado)',
      columns: [
        { name: 'chave', type: 'text', pk: true },
        { name: 'janela_inicio', type: 'timestamptz' },
        { name: 'total', type: 'integer' },
      ],
    },
  ],
};

// ======================== construir dados do grafo ========================
function buildGraphData() {
  const nodeMap = new Map();
  const links = [];

  // Helper para adicionar nó
  const addNode = (id, props) => {
    if (!nodeMap.has(id)) nodeMap.set(id, { id, ...props });
    return nodeMap.get(id);
  };

  // Helper para adicionar link
  const addLink = (sourceId, targetId, props) => {
    links.push({ source: sourceId, target: targetId, ...props });
  };

  // nó central (cérebro)
  addNode('#brain', {
    type: 'brain', name: 'Banco de Dados',
    desc: 'Supabase — fxlansnepokjxdikxocb', depth: 0,
  });

  const tableIds = SCHEMA.tables.map((t) => t.name);

  for (const table of SCHEMA.tables) {
    const nodeId = 'table:' + table.name;
    addNode(nodeId, {
      type: 'table', name: table.name, desc: table.desc,
      colCount: table.columns.length, depth: 1, expanded: false,
    });
    addLink('#brain', nodeId, { kind: 'neural' });

    for (const col of table.columns) {
      const colId = nodeId + ':' + col.name;
      addNode(colId, {
        type: 'column', name: col.name, colType: col.type,
        pk: !!col.pk, fk: col.fk || null, parent: nodeId, depth: 2,
      });
      addLink(nodeId, colId, { kind: 'tree', _hidden: true });
    }

    for (const col of table.columns) {
      if (col.fk) {
        const refTable = col.fk.split('.')[0];
        const refNodeId = 'table:' + refTable;
        if (tableIds.includes(refTable) || refTable === 'auth.users') {
          addLink(nodeId, refNodeId, { kind: 'fk', label: col.name + ' → ' + col.fk });
        }
      }
    }
  }

  return { nodeMap, links };
}

// ======================== bibliotecas sob demanda ========================
/* three.js e 3d-force-graph pesam ~1,3 MB: só baixam quando o Cérebro abre (cópias locais em vendor/) */
function carregarScript(src) {
  return new Promise(function (ok, falha) {
    var s = document.createElement('script');
    s.src = src; s.async = false;
    s.onload = ok; s.onerror = function () { falha(new Error('falhou: ' + src)); };
    document.head.appendChild(s);
  });
}
var bibliotecasCerebro = null;
function carregarBibliotecas() {
  if (window.THREE && window.ForceGraph3D) return Promise.resolve();
  if (!bibliotecasCerebro) {
    bibliotecasCerebro = carregarScript('vendor/three.min.js')
      .then(function () { return carregarScript('vendor/3d-force-graph.min.js'); })
      .catch(function (e) { bibliotecasCerebro = null; throw e; });
  }
  return bibliotecasCerebro;
}

// ======================== componente ========================
function CerebroReinoScreen() {
  const containerRef = React.useRef(null);
  const graphRef = React.useRef(null);
  const stateRef = React.useRef(null);
  const [hud, setHud] = React.useState(null);
  const [detalhe, setDetalhe] = React.useState(null);
  const [trilha, setTrilha] = React.useState([]);
  const [stats, setStats] = React.useState({ nos: 0, fios: 0 });
  const [pronto, setPronto] = React.useState(false);

  const [erro, setErro] = React.useState(null);
  const [libs, setLibs] = React.useState(!!(window.ForceGraph3D && window.THREE));

  React.useEffect(() => {
    if (libs) return;
    let vivo = true;
    carregarBibliotecas()
      .then(() => { if (vivo) setLibs(true); })
      .catch(() => { if (vivo) { setErro('Não foi possível carregar o Cérebro. Verifique sua conexão e abra de novo.'); setPronto(true); } });
    return () => { vivo = false; };
  }, []);

  // mount
  React.useEffect(() => {
    if (!libs || !containerRef.current) return;
    if (!window.ForceGraph3D || !window.THREE) {
      console.warn('Cérebro do Reino: three.js ou 3d-force-graph não carregados');
      setErro('Dependências não carregadas. Verifique sua conexão com a internet.');
      setPronto(true);
      return;
    }

    const THREE = window.THREE;
    const { nodeMap, links } = buildGraphData();
    const state = { nodeMap, links, focusId: null, expandedTables: new Set() };
    stateRef.current = state;

    const visLinks = () => links.filter((l) => !l._hidden);

    const graph = ForceGraph3D({ controlType: 'orbit' })(containerRef.current)
      .backgroundColor('#030817')
      .showNavInfo(false)
      .nodeId('id')
      .nodeLabel(function (n) {
        if (n.type === 'brain') return '<b>' + n.name + '</b><br>' + n.desc;
        if (n.type === 'table') return '<b>' + n.name + '</b><br>' + n.desc + '<br>' + n.colCount + ' colunas';
        return '<b>' + n.name + '</b><br>' + n.colType + (n.fk ? '<br>FK → ' + n.fk : '');
      })
      .nodeColor(function (n) {
        if (n.type === 'brain') return '#3fe3ff';
        if (n.type === 'table') return '#8b5cff';
        return corTipo(n.colType);
      })
      .nodeVal(function (n) {
        if (n.type === 'brain') return 20;
        if (n.type === 'table') return 8 + (n.colCount || 0) * 0.5;
        return 2;
      })
      .nodeOpacity(0.95)
      .nodeResolution(20)
      .linkColor(function (l) {
        if (l.kind === 'fk') return '#f5c76a';
        if (l.kind === 'neural') return '#3fe3ff';
        return '#3b82ff';
      })
      .linkWidth(function (l) { return l.kind === 'fk' ? 1.5 : l.kind === 'neural' ? 0.8 : 0.3; })
      .linkOpacity(0.5)
      .linkDirectionalParticles(function (l) { return l.kind === 'fk' ? 3 : l.kind === 'neural' ? 2 : 0; })
      .linkDirectionalParticleWidth(1.2)
      .linkDirectionalParticleSpeed(0.005)
      .linkDirectionalParticleColor(function (l) { return l.kind === 'fk' ? '#f5c76a' : '#7eeaff'; })
      .linkCurvature(function (l) { return l.kind === 'fk' ? 0.2 : 0; })
      .linkDirectionalArrowLength(4)
      .linkDirectionalArrowRelPos(1)
      .enableNodeDrag(false)
      .onNodeClick(function (n) {
        if (n.type === 'brain') {
          collapseAll(state);
          state.focusId = null;
          setTrilha([]);
          setDetalhe(null);
          flyToBrain(graph);
          refreshGraph(graph, state);
          return;
        }
        if (n.type === 'table') {
          toggleTable(state, n, graph);
          return;
        }
        if (n.type === 'column') {
          setDetalhe(n);
          return;
        }
      })
      .onNodeHover(function (n) {
        if (!n) { setHud(null); return; }
        setHud({
          nome: n.name, tipo: n.type,
          desc: n.desc || n.colType || '',
          pk: n.pk, fk: n.fk, colCount: n.colCount,
        });
      })
      .onBackgroundClick(function () { setDetalhe(null); })
      .cooldownTime(4000)
      .d3AlphaDecay(0.03)
      .d3VelocityDecay(0.4);

    graph.d3Force('center', null);
    graph.d3Force('charge').strength(function (n) {
      return n.type === 'brain' ? -300 : n.type === 'table' ? -80 : -15;
    });
    graph.d3Force('link')
      .distance(function (l) { return l.kind === 'neural' ? 160 : l.kind === 'fk' ? 200 : 18; })
      .strength(function (l) { return l.kind === 'fk' ? 0.15 : l.kind === 'neural' ? 0.3 : 0.5; });

    // estrelas
    var starCount = 800;
    var starPos = new Float32Array(starCount * 3);
    for (var i = 0; i < starCount; i++) {
      var r = 600 + Math.random() * 600;
      var u = Math.random() * 2 - 1;
      var t = Math.random() * Math.PI * 2;
      var s = Math.sqrt(1 - u * u);
      starPos.set([r * s * Math.cos(t), r * u, r * s * Math.sin(t)], i * 3);
    }
    var starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    graph.scene().add(new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: '#6f8cff', size: 1.2, transparent: true, opacity: 0.4, depthWrite: false,
    })));

    graphRef.current = graph;
    refreshGraph(graph, state);
    setPronto(true);

    setTimeout(function () {
      graph.cameraPosition({ x: 0, y: 80, z: 400 }, { x: 0, y: 0, z: 0 }, 2000);
    }, 500);

    return function () {
      if (graph._destructor) graph._destructor();
      else if (graph.scene) {
        // fallback: limpar o container
        while (containerRef.current && containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
      }
      graphRef.current = null;
    };
  }, [libs]);

  function toggleTable(state, tableNode, graph) {
    var tid = tableNode.id;
    if (state.expandedTables.has(tid)) {
      collapseTable(state, tid, graph);
    } else {
      expandTable(state, tableNode, graph);
    }
    refreshGraph(graph, state);
  }

  function expandTable(state, tableNode, graph) {
    var tid = tableNode.id;
    state.expandedTables.add(tid);
    state.focusId = tid;

    state.links.forEach(function (l) {
      if (l.kind === 'tree') {
        var srcId = typeof l.source === 'object' ? l.source.id : l.source;
        if (srcId === tid) l._hidden = false;
      }
    });

    var tableN = state.nodeMap.get(tid);
    if (tableN) {
      var cols = [];
      state.nodeMap.forEach(function (n) { if (n.parent === tid) cols.push(n); });
      var R = 14 + Math.sqrt(cols.length) * 2;
      var step = (Math.PI * 2) / Math.max(cols.length, 1);
      cols.forEach(function (col, i) {
        var angle = i * step;
        col.fx = (tableN.x || 0) + R * Math.cos(angle);
        col.fy = (tableN.y || 0) + (i % 2 === 0 ? 3 : -3);
        col.fz = (tableN.z || 0) + R * Math.sin(angle);
      });
    }

    setTrilha([
      { id: '#brain', name: 'Banco de Dados' },
      { id: tid, name: tableNode.name },
    ]);

    if (graph && tableN) {
      var cam = graph.camera();
      var dx = cam.position.x - (tableN.x || 0);
      var dz = cam.position.z - (tableN.z || 0);
      var dist = 80;
      var r = Math.sqrt(dx * dx + dz * dz) || 1;
      graph.cameraPosition(
        { x: (tableN.x || 0) + (dx / r) * dist, y: (tableN.y || 0) + 15, z: (tableN.z || 0) + (dz / r) * dist },
        { x: tableN.x || 0, y: tableN.y || 0, z: tableN.z || 0 },
        1200,
      );
    }
  }

  function collapseTable(state, tid, graph) {
    state.expandedTables.delete(tid);
    if (state.focusId === tid) state.focusId = null;

    state.links.forEach(function (l) {
      if (l.kind === 'tree') {
        var srcId = typeof l.source === 'object' ? l.source.id : l.source;
        if (srcId === tid) l._hidden = true;
      }
    });

    state.nodeMap.forEach(function (col) {
      if (col.parent === tid) { delete col.fx; delete col.fy; delete col.fz; }
    });

    setTrilha([]);
    setDetalhe(null);
  }

  function collapseAll(state) {
    state.expandedTables.forEach(function (tid) {
      state.links.forEach(function (l) {
        if (l.kind === 'tree') {
          var srcId = typeof l.source === 'object' ? l.source.id : l.source;
          if (srcId === tid) l._hidden = true;
        }
      });
      state.nodeMap.forEach(function (col) {
        if (col.parent === tid) { delete col.fx; delete col.fy; delete col.fz; }
      });
    });
    state.expandedTables.clear();
    state.focusId = null;
  }

  function flyToBrain(graph) {
    graph.cameraPosition({ x: 0, y: 80, z: 400 }, { x: 0, y: 0, z: 0 }, 1400);
  }

  function refreshGraph(graph, state) {
    var allNodes = [];
    state.nodeMap.forEach(function (n) { allNodes.push(n); });
    var vl = state.links.filter(function (l) { return !l._hidden; });
    graph.graphData({ nodes: allNodes, links: vl });
    setStats({ nos: allNodes.length, fios: vl.length });
  }

  function irAoNo(id) {
    var state = stateRef.current;
    var graph = graphRef.current;
    if (!state || !graph) return;
    if (id === '#brain') {
      collapseAll(state);
      setTrilha([]);
      setDetalhe(null);
      flyToBrain(graph);
      refreshGraph(graph, state);
    }
  }

  return React.createElement('div', { className: 'cerebro-reino', style: { height: '100%', width: '100%', position: 'relative' } },
    React.createElement('div', { ref: containerRef, style: { width: '100%', height: '100%' } }),

    !pronto && !erro && React.createElement('div', { className: 'cerebro-loading' },
      React.createElement('span', { className: 'pulso' }, 'Carregando Cérebro do Reino…')
    ),

    erro && React.createElement('div', { className: 'cerebro-loading', style: { color: '#ff4d7a', background: 'rgba(3,8,23,.85)' } },
      React.createElement('span', null, '⚠ ' + erro)
    ),

    trilha.length > 0 && React.createElement('div', { className: 'cerebro-trilha' },
      trilha.map(function (t, i) {
        return React.createElement(React.Fragment, { key: t.id },
          i > 0 && React.createElement('span', { className: 'sep' }, '›'),
          React.createElement('button', {
            className: i === trilha.length - 1 ? 'atual' : '',
            onClick: function () { irAoNo(t.id); },
          }, t.name)
        );
      })
    ),

    hud && React.createElement('div', { className: 'cerebro-hud', style: { top: 16, left: 16 } },
      React.createElement('div', { className: 'breadcrumb' },
        hud.tipo === 'brain' ? 'Banco de Dados' :
        hud.tipo === 'table' ? 'Banco de Dados › ' + hud.nome :
        'Banco de Dados › ... › ' + hud.nome
      ),
      React.createElement('div', { className: 'titulo' },
        React.createElement('span', {
          className: 'dot',
          style: { background: hud.tipo === 'brain' ? '#3fe3ff' : hud.tipo === 'table' ? '#8b5cff' : corTipo(hud.desc) },
        }),
        hud.nome
      ),
      React.createElement('div', { className: 'meta' },
        hud.tipo === 'brain' && '10 tabelas · Schema público + privado',
        hud.tipo === 'table' && React.createElement(React.Fragment, null, hud.desc, React.createElement('br'), hud.colCount, ' colunas'),
        hud.tipo === 'column' && React.createElement(React.Fragment, null,
          'Tipo: ', React.createElement('span', null, hud.desc),
          hud.pk && React.createElement(React.Fragment, null, React.createElement('br'), 'PK: ', React.createElement('span', { style: { color: '#3fe3ff' } }, 'chave primária')),
          hud.fk && React.createElement(React.Fragment, null, React.createElement('br'), 'FK: ', React.createElement('span', { style: { color: '#f5c76a' } }, '→ ' + hud.fk))
        )
      )
    ),

    detalhe && detalhe.type === 'column' && React.createElement('div', { className: 'cerebro-detalhe' },
      React.createElement('button', { className: 'fechar', onClick: function () { setDetalhe(null); } }, '×'),
      React.createElement('h3', null,
        React.createElement('span', { style: { color: corTipo(detalhe.colType) } }, '●'),
        detalhe.name
      ),
      React.createElement('div', { className: 'subtitulo' }, 'Coluna de ' + (detalhe.parent || '').replace('table:', '')),
      React.createElement('div', { className: 'col-lista' },
        React.createElement('div', { className: 'col-item' },
          React.createElement('div', { className: 'col-nome' }, 'Tipo'),
          React.createElement('div', { className: 'col-tipo' }, detalhe.colType)
        ),
        detalhe.pk && React.createElement('div', { className: 'col-item' },
          React.createElement('div', { className: 'col-nome' }, 'Chave Primária'),
          React.createElement('div', { className: 'col-tipo', style: { color: '#3fe3ff' } }, 'PRIMARY KEY')
        ),
        detalhe.fk && React.createElement('div', { className: 'col-item' },
          React.createElement('div', { className: 'col-nome' }, 'Chave Estrangeira'),
          React.createElement('div', { className: 'col-tipo' }, React.createElement('span', { className: 'fk' }, '→ ' + detalhe.fk))
        )
      )
    ),

    detalhe && detalhe.type === 'table' && React.createElement('div', { className: 'cerebro-detalhe' },
      React.createElement('button', { className: 'fechar', onClick: function () { setDetalhe(null); } }, '×'),
      React.createElement('h3', null,
        React.createElement('span', { style: { color: '#8b5cff' } }, '●'),
        detalhe.name
      ),
      React.createElement('div', { className: 'subtitulo' }, detalhe.desc),
      React.createElement('div', { className: 'col-lista' },
        (SCHEMA.tables.find(function (t) { return t.name === detalhe.name; }) || {}).columns && SCHEMA.tables.find(function (t) { return t.name === detalhe.name; }).columns.map(function (col) {
          return React.createElement('div', { className: 'col-item', key: col.name },
            React.createElement('div', { className: 'col-nome', style: { color: corTipo(col.type) } }, col.name),
            React.createElement('div', { className: 'col-tipo' },
              col.type,
              col.pk && React.createElement('span', { style: { color: '#3fe3ff' } }, ' PK'),
              col.fk && React.createElement('span', { className: 'fk' }, ' FK → ' + col.fk)
            )
          );
        })
      )
    ),

    React.createElement('div', { className: 'cerebro-stats' },
      React.createElement('span', null, stats.nos + ' nós · ' + stats.fios + ' fios'),
      React.createElement('div', { className: 'legenda' },
        React.createElement('div', { className: 'legenda-item' }, React.createElement('span', { className: 'dot', style: { background: '#8b5cff' } }), 'Tabela'),
        React.createElement('div', { className: 'legenda-item' }, React.createElement('span', { className: 'dot', style: { background: '#3fe3ff' } }), 'UUID'),
        React.createElement('div', { className: 'legenda-item' }, React.createElement('span', { className: 'dot', style: { background: '#3b82ff' } }), 'Text'),
        React.createElement('div', { className: 'legenda-item' }, React.createElement('span', { className: 'dot', style: { background: '#ffb547' } }), 'Data'),
        React.createElement('div', { className: 'legenda-item' }, React.createElement('span', { className: 'dot', style: { background: '#34e6a6' } }), 'Int'),
        React.createElement('div', { className: 'legenda-item' }, React.createElement('span', { className: 'dot', style: { background: '#f5c76a' } }), 'FK')
      )
    )
  );
}

Object.assign(window, { CerebroReinoScreen: CerebroReinoScreen });
