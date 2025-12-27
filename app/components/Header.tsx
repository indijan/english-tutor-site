"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type UserLite = {
  id: string;
  email?: string | null;
} | null;

type HeaderProps = {
  initialHasUser?: boolean;
};

export default function Header({ initialHasUser = false }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<UserLite>(initialHasUser ? { id: "initial" } : null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (cancelled) return;
      if (error) setUser(null);
      else setUser(data.user ? { id: data.user.id, email: data.user.email } : null);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleNavClick = () => setOpen(false);
  const hasUser = !!user;

  return (
    <header className="site-header">
      <nav className="site-nav">
        <div className="site-brand">angolozzotthonrol.hu</div>

        <button
          type="button"
          className="nav-toggle"
          aria-label={open ? "Menü bezárása" : "Menü megnyitása"}
          aria-controls="primary-nav"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="nav-toggle-bar" />
          <span className="nav-toggle-bar" />
          <span className="nav-toggle-bar" />
        </button>

        <div id="primary-nav" className={`nav-links ${open ? "is-open" : ""}`}>
          <Link href="/" onClick={handleNavClick}>
            Főoldal
          </Link>
          <Link href="/about" onClick={handleNavClick}>
            Rólam
          </Link>
          <Link href="/videos" onClick={handleNavClick}>
            Videótár
          </Link>
          {hasUser ? (
            <>
              <Link href="/favorites" onClick={handleNavClick}>
                Kedvencek
              </Link>
              <Link href="/profile" onClick={handleNavClick} className="nav-link-accent">
                Profil
              </Link>
            </>
          ) : (
            <Link href="/auth" onClick={handleNavClick} className="nav-link-accent">
              Bejelentkezés
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
