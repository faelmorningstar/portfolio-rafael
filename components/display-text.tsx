// As capitais recebem o peso/estilo reais da Centaur; o restante mantém Alchemion normal.
// O texto continua selecionável, e as marcas preservam sua escrita original.
export function DisplayText({ children }: { children: string }) {
  return <>{children.split(/([A-ZÀ-ÖØ-Þ]+)/g).map((part, index) =>
    /^[A-ZÀ-ÖØ-Þ]+$/.test(part)
      ? <span className="display-capitals" key={index}>{part}</span>
      : part
  )}</>;
}
