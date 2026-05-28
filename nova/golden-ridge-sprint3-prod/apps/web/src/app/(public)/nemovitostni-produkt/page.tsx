/**
 * Redirect from /nemovitostni-produkt to /podil
 */

import { redirect } from 'next/navigation';

export default function NemovitostniProduktPage() {
  redirect('/podil');
}
