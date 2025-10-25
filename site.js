// “fake” dados para animar KPIs (opcional)
document.addEventListener('DOMContentLoaded', () => {
  const bump = (id, to) => {
    const el = document.getElementById(id);
    if(!el) return;
    const from = parseInt(el.textContent.replace(/\D/g,'')) || 0;
    let n = from;
    const timer = setInterval(()=>{
      n++;
      el.textContent = String(n).padStart(2,'0');
      if(n >= to) clearInterval(timer);
    }, 45);
  };
  bump('k_consultas', 2);
  bump('k_exames', 1);
  bump('k_enc', 3);

  // “envio” do formulário
  const form = document.getElementById('leadForm');
  if(form){
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      console.log('Lead:', data);
      alert('Recebemos seu pedido. Entraremos em contato ainda hoje!');
      form.reset();
    });
  }
});
