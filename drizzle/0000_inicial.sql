CREATE TABLE "intentos_acceso" (
	"clave" text PRIMARY KEY NOT NULL,
	"intentos" integer DEFAULT 0 NOT NULL,
	"ventana_inicio" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poemas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fecha" date NOT NULL,
	"titulo" text,
	"texto" text NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"editado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "poemas_fecha_idx" ON "poemas" USING btree ("fecha","creado_en");