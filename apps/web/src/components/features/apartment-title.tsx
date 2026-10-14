/**
 * Název apartmánu zalomený pro mobil:
 * „Golden Ridge apartmán č. 4" → „Golden Ridge" / „apartmán č. 4".
 * Číslo drží u „č." / „No." / „nr" pevná mezera, aby nikdy nezůstalo samo na řádku.
 */

const SPLIT = /^(.+?)\s+((?:apartm[aá]n|apartment|apartament)\b.*)$/i;
const NUMBER_GLUE = /(č\.|No\.|nr\.?)\s+(\d)/gi;

export function ApartmentTitle({ title }: { title: string | null | undefined }) {
  if (!title) return null;
  const glued = title.replace(NUMBER_GLUE, '$1 $2');
  const m = glued.match(SPLIT);
  if (!m) return <>{glued}</>;
  return (
    <>
      <span className="block">{m[1]}</span>
      <span className="block">{m[2]}</span>
    </>
  );
}
