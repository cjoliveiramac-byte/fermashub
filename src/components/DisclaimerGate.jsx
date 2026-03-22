"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

const buildKey = (user) => {
  const seed =
    user?.email?.toLowerCase() ||
    user?.username?.toLowerCase() ||
    "user";
  return `fh_disclaimer_${seed}`;
};

export default function DisclaimerGate() {
  const { data, status } = useSession();
  const [dismissed, setDismissed] = useState(false);
  const [canAccept, setCanAccept] = useState(false);

  const storageKey = useMemo(() => {
    if (status !== "authenticated") return "";
    return buildKey(data?.user);
  }, [status, data?.user]);

  const shouldShow =
    status === "authenticated" &&
    !dismissed &&
    storageKey &&
    typeof window !== "undefined" &&
    !localStorage.getItem(storageKey);

  useEffect(() => {
    if (!shouldShow) {
      return;
    }

    const resetId = setTimeout(() => {
      setCanAccept(false);
    }, 0);

    const timeoutId = setTimeout(() => {
      setCanAccept(true);
    }, 4000);

    return () => {
      clearTimeout(resetId);
      clearTimeout(timeoutId);
    };
  }, [shouldShow]);

  if (!shouldShow) {
    return null;
  }

  const handleClose = () => {
    if (storageKey) {
      localStorage.setItem(storageKey, "1");
    }
    setDismissed(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200/70 bg-white p-6 text-sm text-zinc-700 shadow-xl dark:border-zinc-800/70 dark:bg-zinc-950 dark:text-zinc-200">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
          <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
            Aviso importante
          </span>
        </h2>
        <div className="mt-3 space-y-3 leading-relaxed">
          <p>
            Este site é uma plataforma independente e não possui qualquer
            vínculo oficial com a coordenação, direção ou administração do
            Colégio FERMAS. Todo o conteúdo aqui apresentado é de caráter
            informativo e não representa, em nenhuma circunstância,
            posicionamentos institucionais da escola.
          </p>
          <p>
            Reforçamos que quaisquer informações oficiais devem ser obtidas
            diretamente junto à direção ou aos canais formais do colégio. Ao
            continuar navegando neste site, o utilizador declara estar ciente e
            de acordo com esses termos. Sendo assim, o site está a ser gerido
            pela Associação do Colégio FERMAS. Obrigado pela atenção.
          </p>
        </div>
        <button
          className="mt-6 w-full rounded-full bg-[var(--fh-green)] py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleClose}
          disabled={!canAccept}
        >
          Entendi
        </button>
        {!canAccept && (
          <p className="mt-2 text-xs text-zinc-500">
            O botão fica disponível após 4 segundos.
          </p>
        )}
      </div>
    </div>
  );
}

