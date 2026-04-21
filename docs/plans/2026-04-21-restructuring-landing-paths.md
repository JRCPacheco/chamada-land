# Restructuring Landing Page Path Separation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform index.html into a dual-path landing page that clearly separates "Solo Teachers" (Free/Pro Individual) from "Schools/Institutions" (Institutional Pro + Web Panel).

**Architecture:** Use high-contrast layout separation. The page starts with a unified hero, followed by two distinct, large blocks representing the two personas. 

**Core Business Logic to Reflect:**
1. **Solo Teacher:** Can use **Free** (limited, offline, in testing) OR upgrade to **Pro Individual** (subscription).
2. **School/Institution:** Buys an **Institutional Package**. All teachers get Pro features. Admins get **Web Panel Access**.

**Tech Stack:** Tailwind CSS v3 (via CDN), Google Fonts, Material Symbols.

---

### Task 1: Update Hero Section
**Files:**
- Modify: `d:/DEV/Projeto ChamadaFacil/landing/index.html:150-180`

**Step 1: Refactor the Hero.**
Update title and subtext to introduce the two business models.

```html
<section class="relative overflow-hidden bg-white pb-24 pt-32 lg:pt-48">
  <div class="relative mx-auto max-w-7xl px-8 text-center">
    <div class="mb-8 inline-flex items-center rounded-full bg-primary/5 px-4 py-2 text-sm font-semibold text-primary ring-1 ring-inset ring-primary/10">
      <span class="mr-2 flex h-2 w-2 rounded-full bg-primary"></span>
      Chamada escolar inteligente e profissional
    </div>
    <h1 class="mb-8 font-headline text-5xl font-extrabold tracking-tight text-primary sm:text-7xl">
      A solução certa para <br /><span class="text-secondary">quem ensina e quem gere</span>
    </h1>
    <p class="mx-auto mb-12 max-w-3xl text-xl leading-relaxed text-on-surface-variant">
      Do professor solo que busca agilidade offline à escola que precisa de gestão centralizada via Web.
    </p>
    <div class="flex flex-wrap justify-center gap-4">
      <a href="#para-professores" class="rounded-2xl bg-primary px-8 py-4 text-lg font-bold text-white shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
        Sou Professor Solo
      </a>
      <a href="#para-escolas" class="rounded-2xl border-2 border-primary/20 bg-white px-8 py-4 text-lg font-bold text-primary transition-all hover:border-primary/40 hover:bg-surface-container-low active:scale-95">
        Sou uma Instituição
      </a>
    </div>
  </div>
</section>
```

### Task 2: Create "Para Professores Solo" Block
**Files:**
- Modify: `d:/DEV/Projeto ChamadaFacil/landing/index.html` (Insert after Hero)

**Step 1: Implement the Solo Teacher section.**
Highlight the transition from Free to Pro Individual.

```html
<section id="para-professores" class="py-24 bg-surface-container-lowest overflow-hidden">
  <div class="mx-auto max-w-7xl px-8">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      <div>
        <span class="text-secondary font-bold tracking-widest uppercase text-xs mb-4 block">Para Professores • Autonomia Total</span>
        <h2 class="text-4xl font-extrabold text-primary mb-6 font-headline">Agilidade no bolso, com ou sem internet</h2>
        <p class="text-lg text-on-surface-variant mb-8 leading-relaxed">
          Comece hoje com a **Versão Free** para uso offline básico ou assine o **Pro Individual** para ter sincronização em nuvem e turmas ilimitadas.
        </p>
        <div class="space-y-6 mb-10">
          <div class="flex gap-4">
            <div class="flex-none h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold">1</div>
            <div>
              <h4 class="font-bold text-primary">Versão Free (Beta)</h4>
              <p class="text-sm text-on-surface-variant">Uso individual, offline, 1 escola e 1 turma. Perfeito para quem está começando.</p>
            </div>
          </div>
          <div class="flex gap-4">
            <div class="flex-none h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
            <div>
              <h4 class="font-bold text-primary">Upgrade Pro Individual</h4>
              <p class="text-sm text-on-surface-variant">Sincronização em nuvem, múltiplas escolas, turmas ilimitadas e relatórios avançados.</p>
            </div>
          </div>
        </div>
        <a href="login.html?mode=professor" class="inline-flex items-center gap-2 rounded-2xl bg-secondary px-8 py-4 font-bold text-white transition-all hover:bg-secondary/90 shadow-lg shadow-secondary/20">
          Ver planos para Professor
          <span class="material-symbols-outlined">person</span>
        </a>
      </div>
      <div class="relative lg:pl-12">
        <img src="assets/mockup_solo.png" alt="App Solo Interface" class="rounded-[2.5rem] shadow-2xl border-4 border-white" />
      </div>
    </div>
  </div>
</section>
```

### Task 3: Create "Para Escolas & Redes" (Institutional) Block
**Files:**
- Modify: `d:/DEV/Projeto ChamadaFacil/landing/index.html` (Insert after Teacher block)

**Step 1: Implement the School/Institutional section.**
Highlight the Package model and the Web Panel.

```html
<section id="para-escolas" class="py-24 bg-primary text-white overflow-hidden relative">
  <div class="mx-auto max-w-7xl px-8 relative z-10">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      <div class="order-2 lg:order-1">
        <img src="assets/mockup_web_panel.png" alt="Painel Web Institucional" class="rounded-[1.5rem] shadow-2xl border-4 border-white/10" />
      </div>
      <div class="order-1 lg:order-2">
        <span class="text-secondary font-bold tracking-widest uppercase text-xs mb-4 block">Para Escolas • Gestão Institucional</span>
        <h2 class="text-4xl font-extrabold mb-6 font-headline">Sua escola digital, seus dados centralizados</h2>
        <p class="text-lg text-primary-fixed/80 mb-8 leading-relaxed">
          Feche um pacote institucional e libere o **Chamada Fácil Pro** para todos os seus professores. Acompanhe a frequência de toda a rede em tempo real via **Painel Web**.
        </p>
        <ul class="space-y-4 mb-10">
          <li class="flex items-center gap-3">
            <span class="material-symbols-outlined text-secondary">cloud_done</span>
            <span>Sincronização automática entre professores e secretaria.</span>
          </li>
          <li class="flex items-center gap-3">
            <span class="material-symbols-outlined text-secondary">analytics</span>
            <span>Dashboards de frequência e alertas de evasão escolar.</span>
          </li>
          <li class="flex items-center gap-3">
            <span class="material-symbols-outlined text-secondary">devices</span>
            <span>Acesso exclusivo via Web para gestores e coordenadores.</span>
          </li>
        </ul>
        <a href="login.html?mode=escola" class="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 font-bold text-primary transition-all hover:bg-primary-fixed shadow-lg shadow-black/20">
          Consultar Pacotes Escolares
          <span class="material-symbols-outlined">corporate_fare</span>
        </a>
      </div>
    </div>
  </div>
</section>
```

### Task 4: Clean up and Reposition
**Files:**
- Modify: `d:/DEV/Projeto ChamadaFacil/landing/index.html`

**Step 1: Remove redundant sections.**
Delete: "QR Code na prática", "Organização da rotina", "Próximas versões".

**Step 2: Move "Como funciona" (Carousel).**
Move it to be just below the Hero, as it explains the *core mechanism* (QR Code scanning) that both versions share.

### Task 5: Final Verification
**Step 1: Check Anchor Links.**
Verify that the Hero buttons correctly scroll to `#para-professores` and `#para-escolas`.
**Step 2: UI Consistency.**
Ensure the transition between the light "Solo" section and dark "School" section feels intentional and premium.
