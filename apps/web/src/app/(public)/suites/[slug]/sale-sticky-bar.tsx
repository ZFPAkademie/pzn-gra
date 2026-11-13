'use client';

/**
 * Spodní lišta prodeje na mobilu (zadání 13. 11. 2026: víc důrazu na prodej).
 * Objeví se po odscrollování úvodu, schová se, když je vidět sekce #kontakt
 * nebo když je čtenář u patičky (nepřekrývá právní odkazy).
 */

import { useEffect, useState } from 'react';

export function SaleStickyBar({ phone, labels }: { phone: string; labels: { viewing: string; call: string } }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let contactInView = false;
    const update = () => {
      const nearBottom = window.innerHeight + window.scrollY > document.body.scrollHeight - 500;
      setVisible(window.scrollY > 600 && !contactInView && !nearBottom);
    };
    const contact = document.getElementById('kontakt');
    const io = contact
      ? new IntersectionObserver(([e]) => {
          contactInView = e.isIntersecting;
          update();
        })
      : null;
    if (contact && io) io.observe(contact);
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', update);
      io?.disconnect();
    };
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={`md:hidden fixed bottom-0 inset-x-0 z-40 bg-navy border-t border-white/10 px-4 py-3 flex gap-3 transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <a
        href="#kontakt"
        tabIndex={visible ? 0 : -1}
        className="flex-1 flex items-center justify-center min-h-[44px] bg-gold text-navy text-xs uppercase tracking-widest"
      >
        {labels.viewing}
      </a>
      <a
        href={`tel:${phone.replace(/\s/g, '')}`}
        tabIndex={visible ? 0 : -1}
        className="flex items-center justify-center min-h-[44px] px-5 border border-white/30 text-white text-xs uppercase tracking-widest"
      >
        {labels.call}
      </a>
    </div>
  );
}
