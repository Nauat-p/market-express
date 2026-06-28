import { Link, useRouterState } from "@tanstack/react-router";
import { LogIn } from "lucide-react";

export function SignInRequired({
  title = "Entrar para continuar",
  description = "Crie sua conta ou entre para acessar essa área.",
}: {
  title?: string;
  description?: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="px-6 py-20 text-center">
      <div className="size-16 rounded-2xl bg-primary-soft text-primary grid place-items-center mx-auto mb-4">
        <LogIn className="size-7" />
      </div>
      <h2 className="font-serif italic text-xl mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
        {description}
      </p>
      <Link
        to="/auth"
        search={{ redirect: pathname }}
        className="inline-block bg-primary text-primary-foreground rounded-2xl px-6 py-3 text-sm font-semibold"
      >
        Entrar ou criar conta
      </Link>
    </div>
  );
}
