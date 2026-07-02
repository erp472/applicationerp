-- CreateTable
CREATE TABLE "feature_flags_roles" (
    "feature_flags_idfeature_flags" INTEGER NOT NULL,
    "roles_idroles" INTEGER NOT NULL,

    CONSTRAINT "feature_flags_roles_pkey" PRIMARY KEY ("feature_flags_idfeature_flags","roles_idroles")
);

-- CreateTable
CREATE TABLE "feature_flags_usuarios" (
    "feature_flags_idfeature_flags" INTEGER NOT NULL,
    "usuarios_idusuarios" INTEGER NOT NULL,

    CONSTRAINT "feature_flags_usuarios_pkey" PRIMARY KEY ("feature_flags_idfeature_flags","usuarios_idusuarios")
);

-- AddForeignKey
ALTER TABLE "feature_flags_roles" ADD CONSTRAINT "feature_flags_roles_feature_flags_idfeature_flags_fkey" FOREIGN KEY ("feature_flags_idfeature_flags") REFERENCES "feature_flags"("idfeature_flags") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flags_roles" ADD CONSTRAINT "feature_flags_roles_roles_idroles_fkey" FOREIGN KEY ("roles_idroles") REFERENCES "roles"("idroles") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flags_usuarios" ADD CONSTRAINT "feature_flags_usuarios_feature_flags_idfeature_flags_fkey" FOREIGN KEY ("feature_flags_idfeature_flags") REFERENCES "feature_flags"("idfeature_flags") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flags_usuarios" ADD CONSTRAINT "feature_flags_usuarios_usuarios_idusuarios_fkey" FOREIGN KEY ("usuarios_idusuarios") REFERENCES "usuarios"("idusuarios") ON DELETE CASCADE ON UPDATE CASCADE;
