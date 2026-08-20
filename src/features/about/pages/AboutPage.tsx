import '@fontsource-variable/geist-mono/wght.css'
import 'katex/dist/katex.min.css'

import katex from 'katex'
import {
  BrainCircuit,
  ClipboardCheck,
  FileSearch,
  GitCompareArrows,
  LogIn,
  MoveDown,
  Scissors,
  ShieldCheck,
  UploadCloud,
  UserRoundX,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo } from 'react'

import { TransitionLink } from '@/components/common/TransitionLink'
import { useInView } from '@/hooks/useInView'

const ICON_STROKE = 1.5

/**
 * Envuelve un bloque para que aparezca deslizándose hacia arriba la primera vez
 * que entra en viewport. Los estilos viven en `.reveal` (app/styles/index.css),
 * que también respeta prefers-reduced-motion.
 */
function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const { ref, isInView } = useInView<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '0px 0px -60px 0px',
  })

  return (
    <div
      ref={ref}
      data-visible={isInView || undefined}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
      className={className ? `reveal ${className}` : 'reveal'}
    >
      {children}
    </div>
  )
}

function Tex({ tex, className }: { tex: string; className?: string }) {
  const html = useMemo(
    () => katex.renderToString(tex, { throwOnError: false, displayMode: false }),
    [tex],
  )
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
}

function Metric({ label, tex }: { label: string; tex: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <span className="text-ink-500 text-[14px]">{label}</span>
      <Tex tex={tex} className="text-ink-900 text-[15px]" />
    </div>
  )
}

/* ---------------------------------------------------------------- nav ---- */

const NAV_LINKS = [
  { href: '#problema', label: 'Problema' },
  { href: '#modelos', label: 'Modelos' },
  { href: '#corpus', label: 'Corpus' },
  { href: '#datos', label: 'Datos' },
  { href: '#limites', label: 'Límites' },
  { href: '#autores', label: 'Autores' },
]

function SiteNav() {
  return (
    <header className="border-ink-200 bg-background/90 sticky top-0 z-40 border-b backdrop-blur-sm">
      <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between gap-8 px-5 lg:px-8">
        <a href="#inicio" className="flex items-baseline gap-2 whitespace-nowrap">
          <img src="/logo.png" alt="Logo de la UFPS" width={32} height={32} className="h-8 w-8" />
        </a>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-ink-600 hover:text-ink-900 text-[14px] whitespace-nowrap transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <TransitionLink
          href="/login"
          className="bg-brand-600 hover:bg-brand-700 focus-visible:ring-brand-600 focus-visible:ring-offset-background flex items-center gap-2 rounded px-5 py-2.5 text-[14px] font-semibold whitespace-nowrap text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-px"
        >
          <LogIn size={16} />
          <span>Ingresar</span>
        </TransitionLink>
      </div>
    </header>
  )
}

/* --------------------------------------------------------------- hero ---- */

function Hero() {
  return (
    <section id="inicio" className="border-ink-200 relative overflow-hidden border-b">
      <div className="hero-grid mx-auto max-w-[1240px] text-center lg:px-8">
        <div className="hero relative mx-auto flex flex-col justify-between">
          <div className="relative z-10 mx-auto mt-20 flex max-w-xl flex-col items-center gap-6">
            <Reveal>
              <h1 className="font-display text-ink-900 text-3xl leading-[1.08] font-semibold tracking-tight text-balance md:text-4xl lg:text-5xl">
                Componente de IA para la evaluación docente
              </h1>
            </Reveal>

            <Reveal delay={180}>
              <a
                href="#problema"
                className="bg-primary flex h-10 w-10 items-center justify-center rounded-full text-white transition-transform hover:scale-120"
              >
                <MoveDown size={20} />
              </a>
            </Reveal>
          </div>

          <div className="absolute -bottom-20">
            <img
              src="/1.png"
              alt="Ilustración de un robot leyendo un libro"
              className="hero-image mx-auto w-full"
            />
          </div>

          {/* <p className="text-ink-600 mt-7 max-w-[54ch] text-base leading-relaxed">
            Clasifica los comentarios de heteroevaluación por riesgo institucional y dimensión
            pedagógica, y prioriza los casos que requieren atención humana.
          </p> */}

          {/* <div className="mt-10 flex flex-wrap items-center gap-3 justify-center">
            <a
              href="/login"
              className="bg-brand-600 hover:bg-brand-700 focus-visible:ring-brand-600 focus-visible:ring-offset-background inline-flex items-center gap-2.5 rounded px-7 py-3.5 text-[15px] font-semibold whitespace-nowrap text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-px"
            >
              Ingresar
              <MoveRight size={17} strokeWidth={ICON_STROKE} aria-hidden />
            </a>

            <a
              href="#modelos"
              className="border-ink-300 text-ink-800 hover:bg-ink-100 focus-visible:ring-brand-600 focus-visible:ring-offset-background inline-flex items-center rounded border px-7 py-3.5 text-[15px] font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-px"
            >
              Leer el enfoque técnico
            </a>
          </div> */}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------ problema ---- */

const PROBLEM_FACTS = [
  {
    figure: '20 a 40',
    body: 'Docentes que revisa cada director de departamento en un solo periodo académico.',
  },
  {
    figure: 'Sin histórico',
    body: 'Un periodo no se compara con el anterior, así que las señales repetidas pasan inadvertidas.',
  },
]

function Problema() {
  return (
    <section id="problema" className="border-ink-200 border-b py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
        <Reveal>
          <h2 className="font-display text-ink-900 max-w-[25ch] text-[34px] leading-[1.12] font-semibold text-balance md:text-[46px]">
            El problema no es la falta de datos. Es el tiempo para leerlos.
          </h2>
        </Reveal>

        <Reveal
          delay={120}
          className="text-ink-600 mt-8 max-w-[68ch] space-y-5 text-[17px] leading-relaxed"
        >
          <p>
            Cada semestre, un director de departamento recibe los resultados de la evaluación
            docente como reportes PDF dispersos. Las notas cuantitativas se revisan rápido, pero los
            comentarios abiertos, que es donde aparecen los problemas reales requieren mucho tiempo
            de lectura y análisis.
          </p>

          <p>
            Nuestra plataforma reúne los reportes en un solo lugar, clasifica cada comentario por
            nivel de riesgo y por dimensión pedagógica, y pone adelante lo que necesita atención
            inmediata. Los compromisos que se acuerdan con cada docente quedan guardados y siguen
            ahí el semestre siguiente.
          </p>
        </Reveal>

        <div className="border-ink-300 mt-16 grid grid-cols-1 gap-y-10 border-t pt-10 md:grid-cols-3 md:gap-x-12">
          {PROBLEM_FACTS.map((fact, index) => (
            <Reveal key={fact.figure} delay={index * 120}>
              <p className="font-numeric text-ink-900 text-[26px] leading-none font-semibold">
                {fact.figure}
              </p>

              <p className="text-ink-500 mt-4 max-w-[34ch] text-[15px] leading-relaxed">
                {fact.body}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------ objetivos ---- */

const SPECIFIC_OBJECTIVES = [
  'Analizar el proceso actual de evaluación docente en la UFPS.',
  'Identificar las estrategias computacionales de inteligencia artificial más adecuadas para el análisis cuantitativo y cualitativo.',
  'Desarrollar el componente de análisis automatizado, integrado en un sistema administrable.',
  'Establecer casos de prueba unitarios, de integración y de aceptación.',
]

function Objetivos() {
  return (
    <section id="objetivos" className="border-ink-200 bg-ink-100 border-b py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
        <Reveal>
          <p className="font-numeric text-ink-600 text-[12px] tracking-[0.12em]">
            Objetivo general
          </p>

          <p className="font-display text-ink-900 mt-6 max-w-[26ch] text-[30px] leading-[1.18] font-semibold text-balance md:max-w-[30ch] md:text-[42px]">
            Implementar un componente de inteligencia artificial en el proceso de evaluación docente
            de la UFPS como apoyo a la toma de decisiones.
          </p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-x-14 gap-y-10 md:grid-cols-2">
          {SPECIFIC_OBJECTIVES.map((objective, index) => (
            <Reveal
              key={objective}
              delay={index * 100}
              className="border-ink-300 flex gap-5 border-t pt-5"
            >
              <span className="font-numeric text-ink-500 text-lg leading-[1.6]">{index + 1}</span>

              <p className="text-ink-700 text-lg leading-relaxed">{objective}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------- proceso ---- */

const PIPELINE = [
  {
    title: 'Carga masiva',
    body: 'El director sube los reportes PDF del periodo en una sola operación.',
    icon: UploadCloud,
  },
  {
    title: 'Extracción',
    body: 'pdfplumber recupera el texto de los comentarios y las tablas de notas.',
    icon: FileSearch,
  },
  {
    title: 'Segmentación',
    body: 'El texto continuo se separa en comentarios individuales por docente.',
    icon: Scissors,
  },
  {
    title: 'Anonimización',
    body: 'spaCy detecta entidades nombradas y las reemplaza por marcadores genéricos.',
    icon: UserRoundX,
  },
  {
    title: 'Inferencia local',
    body: 'Los dos motores clasifican riesgo institucional y categoría pedagógica.',
    icon: BrainCircuit,
  },
  {
    title: 'Cruce y alerta',
    body: 'La nota cuantitativa se contrasta con el riesgo cualitativo del texto.',
    icon: GitCompareArrows,
  },
  {
    title: 'Seguimiento',
    body: 'Las actas de compromiso docente quedan asociadas al caso que las originó.',
    icon: ClipboardCheck,
  },
]

function Proceso() {
  return (
    <section id="proceso" className="border-ink-200 border-b py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
        <Reveal>
          <h2 className="font-display text-ink-900 max-w-[22ch] text-[32px] leading-[1.14] font-semibold text-balance md:text-[42px]">
            Del PDF a la alerta, sin que el texto salga del servidor
          </h2>
        </Reveal>

        {/* Mobile: timeline vertical */}
        <Reveal delay={120} className="mt-16 max-w-[720px] md:hidden">
          {PIPELINE.map((step, index) => {
            const isLast = index === PIPELINE.length - 1
            const Icon = step.icon

            return (
              <div key={step.title} className="group flex gap-6">
                <div className="flex flex-col items-center">
                  <span className="border-ink-300 bg-background text-ink-600 group-hover:border-brand-600 group-hover:text-brand-600 relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors">
                    <Icon size={16} strokeWidth={ICON_STROKE} aria-hidden />
                  </span>

                  {!isLast && <span className="bg-ink-300 w-px flex-1" aria-hidden />}
                </div>

                <div className={isLast ? 'pt-1.5' : 'pt-1.5 pb-10'}>
                  <span className="font-numeric text-ink-500 text-[12px]">Paso {index + 1}</span>

                  <h3 className="text-ink-900 mt-1 text-[17px] font-semibold">{step.title}</h3>

                  <p className="text-ink-500 mt-2 max-w-[52ch] text-[15px] leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </div>
            )
          })}
        </Reveal>

        {/* Desktop: horizontal, dos filas */}
        <Reveal delay={120} className="mt-16 hidden md:grid md:grid-cols-4 md:gap-x-10 md:gap-y-14">
          {PIPELINE.map((step, index) => {
            const Icon = step.icon
            const isLastInRow = (index + 1) % 4 === 0
            const isLast = index === PIPELINE.length - 1
            const showConnector = !isLastInRow && !isLast

            return (
              <div key={step.title} className="group bg-background rounded-lg p-6">
                <div className="flex items-center gap-3">
                  <span className="border-ink-300 bg-background text-ink-600 group-hover:border-brand-600 group-hover:text-brand-600 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors">
                    <Icon size={16} strokeWidth={ICON_STROKE} aria-hidden />
                  </span>

                  <span className="font-numeric text-ink-500 shrink-0 text-[12px]">
                    Paso {index + 1}
                  </span>

                  {showConnector && (
                    <span className="bg-ink-300 -mr-[5.5rem] h-px flex-1" aria-hidden />
                  )}
                </div>

                <h3 className="text-ink-900 mt-4 text-[17px] font-semibold">{step.title}</h3>

                <p className="text-ink-500 mt-2 text-[15px] leading-relaxed">{step.body}</p>
              </div>
            )
          })}
        </Reveal>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------- modelos ---- */

const RISK_LEVELS = [
  { level: 'BAJO', tone: 'bg-ink-200 text-ink-700' },
  { level: 'MEDIO', tone: 'bg-ink-300 text-ink-900' },
  { level: 'ALTO', tone: 'bg-brand-600 text-white' },
]

const PEDAGOGIC_CATEGORIES = [
  'Desarrollo del Conocimiento',
  'Desempeño Docente',
  'Procesos de Evaluación',
  'Integración Interpersonal',
]

function Modelos() {
  return (
    <section id="modelos" className="border-ink-200 border-b py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
        <Reveal>
          <h2 className="font-display text-ink-900 max-w-[24ch] text-[32px] leading-[1.14] font-semibold text-balance md:text-[42px]">
            Dos modelos ajustados, ninguno generativo
          </h2>

          <p className="text-ink-600 mt-8 max-w-[68ch] text-[17px] leading-relaxed">
            Partimos de Transformers preentrenados en español y les aplicamos ajuste fino sobre un
            corpus de comentarios de heteroevaluación etiquetado para esta tarea. DistilBETO
            aprendió a estimar qué tan grave es un comentario. RoBERTuito aprendió a reconocer de
            qué dimensión del ejercicio docente está hablando.
          </p>
        </Reveal>

        <Reveal delay={120} className="bg-ink-200 mt-14 grid grid-cols-1 gap-px md:grid-cols-2">
          <article className="bg-background p-7 md:p-9">
            <p className="font-numeric text-ink-500 text-[12px] tracking-[0.12em]">Motor A</p>

            <h3 className="font-display text-ink-900 mt-4 text-[26px] leading-tight">
              Nivel de riesgo institucional
            </h3>

            <p className="text-ink-600 mt-4 text-[15px] leading-relaxed">
              Clasificación de cada comentario en un único nivel, con DistilBETO ajustado durante
              cinco épocas.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              {RISK_LEVELS.map((risk) => (
                <span
                  key={risk.level}
                  className={`font-numeric rounded px-3 py-1.5 text-[12px] tracking-[0.1em] ${risk.tone}`}
                >
                  {risk.level}
                </span>
              ))}
            </div>

            <div className="divide-ink-200 border-ink-200 mt-8 divide-y border-t">
              <Metric label="F1 Macro" tex="F_1^{\text{macro}} = 79{,}30\,\%" />
              <Metric label="Latencia por comentario" tex="0{,}40\ \text{s}" />
              <Metric label="Huella de memoria" tex="\approx 879\ \text{MB}" />
            </div>
          </article>

          <article className="bg-background p-7 md:p-9">
            <p className="font-numeric text-ink-500 text-[12px] tracking-[0.12em]">Motor B</p>

            <h3 className="font-display text-ink-900 mt-4 text-[26px] leading-tight">
              Categorías pedagógicas
            </h3>

            <p className="text-ink-600 mt-4 text-[15px] leading-relaxed">
              Clasificación multietiqueta: un mismo comentario puede pertenecer a varias
              dimensiones. RoBERTuito ajustado durante tres épocas.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              {PEDAGOGIC_CATEGORIES.map((category) => (
                <span
                  key={category}
                  className="border-ink-300 text-ink-700 rounded border px-3 py-1.5 text-[12px]"
                >
                  {category}
                </span>
              ))}
            </div>

            <div className="divide-ink-200 border-ink-200 mt-8 divide-y border-t">
              <Metric label="F1 Macro" tex="F_1^{\text{macro}} = 79{,}05\,\%" />
              <Metric label="Hamming Loss" tex="\text{HL} = 0{,}1335" />
              <Metric label="Latencia por comentario" tex="0{,}63\ \text{s}" />
              <Metric label="Huella de memoria" tex="\approx 954\ \text{MB}" />
            </div>
          </article>
        </Reveal>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ llm ---- */

function PapelDelLlm() {
  return (
    <section id="llm" className="border-ink-200 bg-ink-100 border-b py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
        <Reveal className="border-ink-300 border-t-brand-600 bg-background rounded border border-t-2 p-7 md:p-12">
          <h2 className="font-display text-ink-900 max-w-[22ch] text-[30px] leading-[1.14] font-semibold text-balance md:text-[40px]">
            Dónde estuvo el modelo generativo y dónde no está
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-16">
            <div>
              <h3 className="text-ink-900 text-[15px] font-semibold">
                Durante la fase de investigación
              </h3>
              <p className="text-ink-600 mt-4 text-[16px] leading-relaxed">
                Gemini Pro 3 se usó únicamente como anotador asistido, bajo el enfoque conocido como
                LLM as Annotator, para etiquetar el corpus de entrenamiento. Todo texto enviado pasó
                antes por anonimización obligatoria.
              </p>
            </div>
            <div className="border-ink-300 border-t pt-8 md:border-t-0 md:border-l md:pt-0 md:pl-16">
              <h3 className="text-ink-900 text-[15px] font-semibold">Durante la operación</h3>
              <p className="text-ink-600 mt-4 text-[16px] leading-relaxed">
                Gemini no forma parte del sistema. No se invoca, no recibe ningún comentario y no
                participa en ninguna predicción. La inferencia ocurre solo con los dos modelos
                alojados en el servidor de la universidad.
              </p>
            </div>
          </div>

          <div className="border-ink-200 mt-12 border-t pt-8">
            <p className="font-display text-ink-900 max-w-[46ch] text-[24px] leading-snug font-semibold md:text-[30px]">
              Ningún comentario de estudiante sale de la infraestructura de la UFPS durante la
              operación del sistema.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ corpus -- */

const CORPUS_FIGURES = [
  {
    figure: '8.000',
    prefix: 'aprox.',
    body: 'Comentarios del conjunto público de RateMyProfessor, traducidos y adaptados al español.',
  },
  {
    figure: '4.201',
    prefix: null,
    body: 'Comentarios institucionales del Departamento de Ingeniería de Sistemas, periodo 2012 a 2025.',
  },
  {
    figure: '300',
    prefix: null,
    body: 'Comentarios de una muestra aleatoria, revisados por anotadores humanos independientes.',
  },
]

function Corpus() {
  return (
    <section id="corpus" className="border-ink-200 border-b py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
        <Reveal>
          <h2 className="font-display text-ink-900 max-w-[26ch] text-[32px] leading-[1.14] font-semibold text-balance md:text-[42px]">
            Cerca de 12.000 comentarios
          </h2>

          <p className="text-ink-600 mt-8 max-w-[68ch] text-[17px] leading-relaxed">
            Al corpus se le inyectó de forma deliberada ruido lingüístico de la frontera colombo
            venezolana: jerga, ironía y errores ortográficos para que los modelos aprendieran a
            lidiar con la realidad de los comentarios de heteroevaluación.
          </p>
        </Reveal>
      </div>

      <div className="mx-auto mt-16 max-w-[1240px] px-5 lg:px-8">
        <div className="border-ink-300 grid grid-cols-1 gap-x-10 gap-y-10 border-t pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {CORPUS_FIGURES.map((item, index) => (
            <Reveal key={item.figure} delay={index * 120}>
              <p className="flex items-baseline gap-2">
                {item.prefix ? (
                  <span className="text-ink-500 text-[13px]">{item.prefix}</span>
                ) : null}
                <span className="font-numeric text-ink-900 text-[28px] leading-none font-semibold">
                  {item.figure}
                </span>
              </p>
              <p className="text-ink-500 mt-4 max-w-[32ch] text-[14px] leading-relaxed">
                {item.body}
              </p>
            </Reveal>
          ))}
        </div>

        {/* <p className="text-ink-600 mt-12 max-w-[68ch] text-[16px] leading-relaxed">
          El acuerdo entre las etiquetas automáticas y la revisión humana se midió con Kappa de
          Cohen <Tex tex="\kappa" className="text-ink-900" /> para la tarea de riesgo y con Alpha de
          Krippendorff <Tex tex="\alpha" className="text-ink-900" /> para la tarea multietiqueta.
        </p> */}
      </div>
    </section>
  )
}

/* -------------------------------------------------------------- privacidad -- */

function Privacidad() {
  return (
    <section id="datos" className="border-ink-200 bg-ink-100 border-b py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
        <Reveal className="flex items-start gap-4">
          <ShieldCheck
            size={30}
            strokeWidth={ICON_STROKE}
            className="text-brand-600 dark:text-brand-400 mt-1 shrink-0"
            aria-hidden
          />

          <h2 className="font-display text-ink-900 max-w-[24ch] text-[32px] leading-[1.14] font-semibold text-balance md:text-[42px]">
            Los datos no salen del servidor de la universidad
          </h2>
        </Reveal>

        <Reveal
          delay={120}
          className="bg-ink-300 mt-14 grid grid-cols-1 gap-px overflow-hidden rounded lg:grid-cols-4"
        >
          <div className="bg-ink-200 p-7 md:p-9 lg:col-span-2">
            <h3 className="text-ink-900 text-[15px] font-semibold">Inferencia local</h3>

            <p className="text-ink-600 mt-4 text-[15px] leading-relaxed">
              Los modelos viven en la infraestructura de la UFPS y se ejecutan allí. Ningún
              comentario de estudiante se envía a un servicio de terceros durante la operación.
            </p>

            <h4 className="text-ink-900 mt-7 text-[15px] font-semibold">
              Requisitos mínimos del servidor para ejecutar los modelos:
            </h4>

            <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                ['Memoria', '1 GB RAM'],
                ['Computo', '0,5 vCPU'],
                ['Sistema', 'Ubuntu 22.04 LTS'],
                ['Aceleración', 'Sin GPU'],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-ink-600 text-[13px]">{label}</dt>
                  <dd className="font-numeric text-ink-900 mt-1 text-[15px]">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative min-h-[220px] lg:col-span-2">
            <img
              src="https://ww2.ufps.edu.co/public/imagenes/template/header/vista_ufps.png"
              alt="Imagen de la Universidad Francisco de Paula Santander"
              width={1400}
              height={900}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>

          <div className="bg-background p-7 md:p-9 lg:col-span-2">
            <h3 className="text-ink-900 text-[15px] font-semibold">
              Anonimización antes de procesar
            </h3>

            <p className="text-ink-600 mt-4 text-[15px] leading-relaxed">
              El Reconocimiento de Entidades Nombradas con spaCy corre antes de cualquier otro paso.
              Nombres de estudiantes y docentes, asignaturas identificables y lugares se reemplazan
              por marcadores genéricos.
            </p>
          </div>

          <div className="bg-background p-7 md:p-9">
            <h3 className="text-ink-900 text-[15px] font-semibold">Ley 1581 de 2012</h3>

            <p className="text-ink-600 mt-4 text-[15px] leading-relaxed">
              Tratamiento conforme al régimen colombiano de hábeas data, con autenticación
              institucional y control de acceso por roles.
            </p>
          </div>

          <div className="bg-background p-7 md:p-9">
            <h3 className="text-ink-900 text-[15px] font-semibold">Registro de auditoría</h3>

            <p className="text-ink-600 mt-4 text-[15px] leading-relaxed">
              Inalterable. Guarda qué versión del modelo produjo cada predicción, de modo que un
              resultado pasado siempre se puede explicar.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <p className="border-brand-600 font-display text-ink-900 mt-10 border-l-2 pl-6 text-[24px] leading-snug font-semibold md:text-[30px]">
            Ningún rol del sistema puede identificar al autor de un comentario.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

/* ----------------------------------------------------------------- límites -- */

const LIMITS = [
  {
    title: 'Sesgo heredado del etiquetado asistido',
    body: 'El corpus de entrenamiento fue etiquetado con apoyo de un modelo generativo. Los sesgos de ese anotador quedan incorporados en los modelos ajustados. Por eso la validación humana independiente forma parte del diseño y no es un anexo.',
  },
  {
    title: 'Solo heteroevaluación',
    body: 'La autoevaluación y la coevaluación quedan fuera del alcance. El componente no las procesa ni las interpreta.',
  },
  {
    title: 'El instrumento no se toca',
    body: 'El sistema no modifica las preguntas, las escalas ni las ponderaciones de la evaluación docente vigente. Lee lo que el proceso ya produce.',
  },
]

function Límites() {
  return (
    <section id="limites" className="border-ink-200 border-b py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
        <Reveal>
          <h2 className="font-display text-ink-900 max-w-[30ch] text-[32px] leading-[1.14] font-semibold text-balance md:text-[42px]">
            El sistema prioriza. La decisión sigue siendo del director.
          </h2>

          <p className="text-ink-600 mt-8 max-w-[68ch] text-[17px] leading-relaxed">
            El componente ordena el material y señala dónde mirar primero. La decisión sobre cada
            docente permanece en el director de departamento y su Consejo. Estos son los límites
            conocidos del trabajo:
          </p>
        </Reveal>

        <Reveal delay={120} className="border-ink-200 mt-12 max-w-[900px] border-t">
          {LIMITS.map((limit) => (
            <details key={limit.title} className="group border-ink-200 border-b">
              <summary className="text-ink-900 hover:text-brand-600 dark:hover:text-brand-400 focus-visible:ring-brand-600 flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[17px] font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                {limit.title}
                <span
                  aria-hidden
                  className="text-ink-500 relative h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
                >
                  <span className="absolute top-1/2 left-0 h-px w-4 -translate-y-1/2 bg-current" />
                  <span className="absolute top-0 left-1/2 h-4 w-px -translate-x-1/2 bg-current" />
                </span>
              </summary>
              <p className="text-ink-600 max-w-[64ch] pb-6 text-[16px] leading-relaxed">
                {limit.body}
              </p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------- repositorio -- */

// function Repositorio() {
//   return (
//     <section id="repositorio" className="border-ink-200 bg-ink-100 border-b py-20 md:py-28">
//       <div className="mx-auto max-w-[760px] px-5 lg:px-8">
//         <div className="border-ink-300 bg-background border p-8 md:p-10">
//           <FileLock2 size={24} strokeWidth={ICON_STROKE} className="text-ink-500" aria-hidden />
//           {REPOSITORY_URL ? (
//             <>
//               <h2 className="font-display text-ink-900 mt-6 text-[28px] leading-tight">
//                 Código público
//               </h2>
//               <p className="text-ink-600 mt-4 text-[16px] leading-relaxed">
//                 El repositorio se publicó tras verificar que no contiene datos institucionales,
//                 corpus con comentarios reales, credenciales, endpoints internos ni volcados de base
//                 de datos.
//               </p>
//               <a
//                 href={REPOSITORY_URL}
//                 target="_blank"
//                 rel="noreferrer noopener"
//                 className="border-ink-800 text-ink-900 hover:bg-ink-900 hover:text-background focus-visible:ring-brand-600 focus-visible:ring-offset-background mt-8 inline-flex items-center gap-2.5 rounded-none border px-6 py-3 text-[15px] font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:translate-y-px"
//               >
//                 Ver el repositorio
//                 <MoveRight size={17} strokeWidth={ICON_STROKE} aria-hidden />
//               </a>
//             </>
//           ) : (
//             <>
//               <h2 className="font-display text-ink-900 mt-6 text-[28px] leading-tight">
//                 Código bajo custodia institucional
//               </h2>
//               <p className="text-ink-600 mt-4 text-[16px] leading-relaxed">
//                 No hay verificación pública de que el repositorio esté libre de datos
//                 institucionales, corpus con comentarios reales, credenciales, endpoints internos o
//                 volcados de base de datos. Mientras esa verificación no se realice y quede
//                 documentada, el código permanece bajo custodia de la Universidad Francisco de Paula
//                 Santander y no se publica.
//               </p>
//               <p className="border-ink-200 text-ink-500 mt-6 border-t pt-6 text-[15px] leading-relaxed">
//                 Las solicitudes de revisión académica del código se tramitan ante el Departamento de
//                 Ingeniería de Sistemas, Facultad de Ingeniería, a nombre de la dirección del
//                 proyecto.
//               </p>
//             </>
//           )}
//         </div>
//       </div>
//     </section>
//   )
// }

/* ------------------------------------------------------------------ autores -- */

const AUTHORS = [
  {
    photo: '',
    name: 'Orlando José Beltrán Valero',
    code: '1152167',
    url: 'https://github.com/DevOB31',
  },
  {
    photo: 'https://www.byandrev.dev/assets/andres-parra.jpg',
    name: 'Andrés Alfonso Parra Garzón',
    code: '1152185',
    url: 'https://www.byandrev.dev/',
  },
  {
    photo: 'https://avatars.githubusercontent.com/u/114622930?v=4',
    name: 'Alessandro Umberto Daniele Saltarín',
    code: '1152194',
    url: 'https://github.com/AlessandroDani',
  },
]

const ADVISORS = [
  {
    photo:
      'https://docentes.ufps.edu.co/public/imagenes/107139d17b0e2a8b09a4ec6f2be6a2cfdd4c956545eb364dbc8b7d1b402e3e77.JPEG',
    name: 'Ph.D. Marco Antonio Adarme Jaimes',
    role: 'Director',
    url: 'https://www.madarme.co/',
  },
  {
    photo:
      'https://docentes.ufps.edu.co/public/imagenes/1f8e6f3c0f57d2003077f6222c0251bf936b1df76b6924143ea80f37ccaf8762.JPEG',
    name: 'Ph.D. Eduard Gilberto Puerto Cuadros',
    role: 'Codirector',
  },
]

function Autores() {
  return (
    <section id="autores" className="py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-5 lg:px-8">
        <Reveal>
          <h2 className="font-display text-ink-900 text-[32px] leading-[1.14] font-semibold md:text-[42px]">
            Autores y dirección
          </h2>
        </Reveal>

        <dl className="mt-14 grid grid-cols-1 gap-y-10 md:grid-cols-12 md:gap-x-12">
          <dt className="font-numeric text-ink-500 text-[12px] tracking-[0.12em] md:col-span-3">
            Autores
          </dt>

          <dd className="md:col-span-9">
            <Reveal>
              <ul className="divide-ink-200 border-ink-200 divide-y border-t">
                {AUTHORS.map((author) => (
                  <li key={author.code} className="flex flex-wrap items-center gap-x-4 py-4">
                    <img
                      src={author.photo}
                      alt={author.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />

                    <a
                      className="text-ink-900 text-[18px]"
                      href={author.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {author.name}
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>
          </dd>

          <dt className="font-numeric text-ink-500 text-[12px] tracking-[0.12em] md:col-span-3">
            Dirección
          </dt>

          <dd className="md:col-span-9">
            <Reveal>
              <ul className="divide-ink-200 border-ink-200 divide-y border-t">
                {ADVISORS.map((advisor) => (
                  <li key={advisor.name} className="flex flex-wrap items-center gap-x-4 py-4">
                    <img
                      src={advisor.photo}
                      alt={advisor.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />

                    <a
                      className="text-ink-900 text-[18px]"
                      href={advisor.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {advisor.name}
                    </a>

                    <span className="text-ink-500 text-[13px]">{advisor.role}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </dd>
        </dl>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------- footer -- */

function SiteFooter() {
  return (
    <footer className="border-ink-200 bg-ink-100 border-t py-12">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-5 md:flex-row md:items-end md:justify-between lg:px-8">
        <div>
          <p className="text-ink-600 mt-4 max-w-[46ch] text-[14px] leading-relaxed">
            <a
              href="https://www.ufps.edu.co"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-600 hover:text-brand-600 dark:hover:text-brand-400 underline underline-offset-4 transition-colors"
            >
              Universidad Francisco de Paula Santander
            </a>
            . Facultad de Ingeniería, programa de Ingeniería de Sistemas. San José de Cúcuta, 2025.
          </p>
        </div>
        <a
          href="/login"
          className="text-ink-700 hover:text-brand-600 dark:hover:text-brand-400 text-[14px] font-medium whitespace-nowrap underline underline-offset-4 transition-colors"
        >
          Ingresar
        </a>
      </div>
    </footer>
  )
}

/* --------------------------------------------------------------------- page -- */

export default function AboutPage() {
  return (
    <div className="bg-background text-ink-900 min-h-[100dvh]">
      <SiteNav />
      <main>
        <Hero />
        <Problema />
        <Objetivos />
        <Proceso />
        <Modelos />
        <PapelDelLlm />
        <Corpus />
        <Privacidad />
        <Límites />
        {/* <Repositorio /> */}
        <Autores />
      </main>
      <SiteFooter />
    </div>
  )
}
