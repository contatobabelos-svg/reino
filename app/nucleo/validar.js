/* Reino · validações comuns do cadastro e do perfil (AJ2, 22/09): as mesmas regras do servidor
   (supabase/functions/_shared/reino-validar.ts). Usado pelo LoginImersivo e por Minha conta. */
(function () {
  const soDigitos = (v) => String(v || "").replace(/\D/g, "");
  const mascaraCnpj = (v) => {
    const d = soDigitos(v).slice(0, 14);
    let o = d.slice(0, 2);
    if (d.length > 2) o += "." + d.slice(2, 5);
    if (d.length > 5) o += "." + d.slice(5, 8);
    if (d.length > 8) o += "/" + d.slice(8, 12);
    if (d.length > 12) o += "-" + d.slice(12, 14);
    return o;
  };
  function cnpjValido(c) {
    if (!/^\d{14}$/.test(c) || /^(\d)\1{13}$/.test(c)) return false;
    const dv = (pesos) => { const s = pesos.reduce((t, p, i) => t + Number(c[i]) * p, 0) % 11; return s < 2 ? 0 : 11 - s; };
    return dv([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(c[12]) && dv([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(c[13]);
  }
  /* WhatsApp do Brasil: mesma regra do servidor (normalizarWhatsapp) */
  function normalizarWhatsapp(v) {
    let d = soDigitos(v);
    if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
    if (d.length !== 10 && d.length !== 11) return "";
    if (!/^[1-9][1-9]/.test(d)) return "";
    if (d.length === 11 && d[2] !== "9") return "";
    return "+55" + d;
  }
  const mascaraWhatsapp = (v) => {
    const d = soDigitos(v).replace(/^55(?=\d{10,11}$)/, "").slice(0, 11);
    if (d.length <= 2) return d.length ? "(" + d : "";
    const resto = d.slice(2), corte = d.length === 11 ? 5 : 4;
    return "(" + d.slice(0, 2) + ") " + resto.slice(0, corte) + (resto.length > corte ? "-" + resto.slice(corte) : "");
  };
  /* ---------------------------------------------------------------- cidade e UF (AF11)
     A empresa só aparece no mapa do Reino com cidade e UF. A pessoa escreve tudo
     numa linha ("Campinas, SP", "Campinas - SP" ou "Campinas SP") e conferimos o
     nome na lista de municípios do IBGE (dados/municipios-tudo.js): é dela que sai
     a posição no mapa. Sem a lista carregada, aceita o que foi escrito. */
  const UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
    "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
  const semAcento = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  function lerCidadeUf(valor) {
    const bruto = String(valor || "").replace(/\s+/g, " ").trim();
    if (!bruto) return { erro: "Escreva a cidade e a UF, assim: Campinas, SP." };
    const m = bruto.match(/^(.*?)[\s,;/•-]+([A-Za-z]{2})$/);
    if (!m) return { erro: "Falta a UF. Escreva assim: Campinas, SP." };
    const uf = m[2].toUpperCase();
    const cidade = m[1].replace(/[,;/-]+$/, "").trim();
    if (!UFS.includes(uf)) return { erro: `"${uf}" não é uma UF do Brasil. Escreva assim: Campinas, SP.` };
    if (cidade.length < 2) return { erro: "Faltou o nome da cidade. Escreva assim: Campinas, SP." };
    const lista = window.REINO_MUNICIPIOS && window.REINO_MUNICIPIOS[uf] && window.REINO_MUNICIPIOS[uf].cidades;
    if (!lista || !lista.length) return { cidade, uf };
    const alvo = semAcento(cidade);
    const exata = lista.find((c) => semAcento(c.nome) === alvo);
    if (exata) return { cidade: exata.nome, uf };
    const perto = lista.filter((c) => semAcento(c.nome).startsWith(alvo.slice(0, 4))).slice(0, 3).map((c) => c.nome);
    return { erro: `Não achei "${cidade}" em ${uf}.` + (perto.length ? ` Você quis dizer ${perto.join(", ")}?` : " Confira o nome da cidade.") };  }

  window.ReinoValidar = { soDigitos, mascaraCnpj, cnpjValido, normalizarWhatsapp, mascaraWhatsapp, lerCidadeUf, UFS };
})();
