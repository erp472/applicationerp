-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateEnum
CREATE TYPE "tipo_sucursal" AS ENUM ('unipersonal', 'multipuesto');

-- CreateEnum
CREATE TYPE "sistema_operativo_equipo" AS ENUM ('windows', 'linux', 'macos');

-- CreateEnum
CREATE TYPE "tipo_documento_identidad" AS ENUM ('cedula', 'pasaporte', 'tarjeta_identidad', 'nit', 'extranjeria');

-- CreateEnum
CREATE TYPE "tipo_producto" AS ENUM ('estampilla', 'filatelia', 'empaque', 'material_oficina', 'otro');

-- CreateEnum
CREATE TYPE "tipo_servicio_envio" AS ENUM ('nacional', 'internacional_ms', 'internacional_courier', 'apartado_postal');

-- CreateEnum
CREATE TYPE "tipo_caja" AS ENUM ('menor', 'general', 'pos');

-- CreateEnum
CREATE TYPE "estado_sesion_caja" AS ENUM ('abierta', 'cerrada', 'forzada');

-- CreateEnum
CREATE TYPE "tipo_movimiento_caja" AS ENUM ('apertura', 'cierre', 'venta_producto', 'venta_servicio', 'venta_estampilla', 'giro_pago', 'giro_emision_cobro', 'consignacion', 'reposicion', 'cambio_custodia_in', 'cambio_custodia_out', 'diferencia_faltante', 'diferencia_sobrante', 'anulacion', 'recaudo', 'moneda_circulante', 'apartado_postal');

-- CreateEnum
CREATE TYPE "medio_pago" AS ENUM ('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'consignacion', 'preporteado', 'mixto_preporteado');

-- CreateEnum
CREATE TYPE "medio_consignacion" AS ENUM ('banco', 'transportadora');

-- CreateEnum
CREATE TYPE "tipo_cuenta_bancaria" AS ENUM ('ahorros', 'corriente');

-- CreateEnum
CREATE TYPE "estado_aprobacion" AS ENUM ('pendiente', 'aprobada', 'rechazada');

-- CreateEnum
CREATE TYPE "estado_venta" AS ENUM ('activa', 'anulada');

-- CreateEnum
CREATE TYPE "tipo_envio" AS ENUM ('nacional', 'internacional_ms', 'internacional_courier');

-- CreateEnum
CREATE TYPE "estado_envio" AS ENUM ('facturado', 'en_saca', 'despachado', 'en_transito', 'entregado', 'anulado', 'novedad');

-- CreateEnum
CREATE TYPE "tipo_factura" AS ENUM ('recibo_venta', 'electronica');

-- CreateEnum
CREATE TYPE "estado_factura" AS ENUM ('emitida', 'anulada', 'rechazada_dian');

-- CreateEnum
CREATE TYPE "tipo_movimiento_inventario" AS ENUM ('entrada', 'salida', 'ajuste', 'devolucion');

-- CreateEnum
CREATE TYPE "estado_orden_inventario" AS ENUM ('pendiente', 'confirmada', 'rechazada', 'parcial');

-- CreateEnum
CREATE TYPE "estado_orden_inventario_item" AS ENUM ('pendiente', 'confirmado', 'rechazado', 'parcial');

-- CreateEnum
CREATE TYPE "tipo_saca" AS ENUM ('nacional', 'internacional');

-- CreateEnum
CREATE TYPE "tipo_consolidacion_saca" AS ENUM ('consolidada', 'directa');

-- CreateEnum
CREATE TYPE "estado_saca" AS ENUM ('abierta', 'cerrada');

-- CreateEnum
CREATE TYPE "tamano_apartado_postal" AS ENUM ('pequeno', 'mediano', 'grande');

-- CreateEnum
CREATE TYPE "estado_apartado_postal" AS ENUM ('disponible', 'ocupado', 'vencido', 'mantenimiento');

-- CreateEnum
CREATE TYPE "tipo_giro" AS ENUM ('nacional', 'moneygram', 'ria', 'ifs');

-- CreateEnum
CREATE TYPE "operacion_giro" AS ENUM ('emision', 'pago');

-- CreateEnum
CREATE TYPE "flete_asumido_giro" AS ENUM ('remitente', 'beneficiario');

-- CreateEnum
CREATE TYPE "resultado_inspektor" AS ENUM ('limpio', 'alerta', 'bloqueado');

-- CreateEnum
CREATE TYPE "estado_giro" AS ENUM ('pendiente', 'aprobado', 'pagado', 'anulado', 'rechazado');

-- CreateEnum
CREATE TYPE "tipo_api_convenio" AS ENUM ('rest', 'barcode', 'sftp');

-- CreateEnum
CREATE TYPE "estado_recaudo" AS ENUM ('exitoso', 'fallido', 'anulado');

-- CreateEnum
CREATE TYPE "tipo_lista_restrictiva" AS ENUM ('SAGRILAFT', 'OFAC', 'terrorismo', 'pep', 'interno');

-- CreateEnum
CREATE TYPE "tipo_alerta" AS ENUM ('consignacion_pendiente', 'anulacion_solicitada', 'diferencia_faltante', 'diferencia_sobrante', 'moneda_circulante', 'inventario_bajo', 'apartado_por_vencer', 'apartado_vencido', 'orden_inventario', 'reposicion_caja', 'limite_efectivo_caja', 'cierre_automatico');

-- CreateEnum
CREATE TYPE "estado_alerta" AS ENUM ('pendiente', 'aprobada', 'rechazada', 'vista');

-- CreateEnum
CREATE TYPE "operacion_auditoria" AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "entorno_feature_flag" AS ENUM ('all', 'dev', 'staging', 'prod');

-- CreateTable
CREATE TABLE "comercios" (
    "idcomercios" SERIAL NOT NULL,
    "codigocomercios" VARCHAR(20) NOT NULL,
    "nombrecomercios" VARCHAR(200) NOT NULL,
    "nitcomercios" VARCHAR(30) NOT NULL,
    "activocomercios" BOOLEAN NOT NULL DEFAULT true,
    "created_atcomercios" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_atcomercios" TIMESTAMPTZ(6),

    CONSTRAINT "comercios_pkey" PRIMARY KEY ("idcomercios")
);

-- CreateTable
CREATE TABLE "regionales" (
    "idregionales" SERIAL NOT NULL,
    "comercios_idcomercios" INTEGER NOT NULL,
    "codigoregionales" VARCHAR(20) NOT NULL,
    "nombreregionales" VARCHAR(200) NOT NULL,
    "activoregionales" BOOLEAN NOT NULL DEFAULT true,
    "created_atregionales" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_atregionales" TIMESTAMPTZ(6),

    CONSTRAINT "regionales_pkey" PRIMARY KEY ("idregionales")
);

-- CreateTable
CREATE TABLE "sucursales" (
    "idsucursales" SERIAL NOT NULL,
    "regionales_idregionales" INTEGER NOT NULL,
    "codigosucursales" VARCHAR(20) NOT NULL,
    "nombresucursales" VARCHAR(200) NOT NULL,
    "ciudadsucursales" VARCHAR(100),
    "departamentosucursales" VARCHAR(100),
    "direccionsucursales" TEXT,
    "tiposucursales" "tipo_sucursal" NOT NULL DEFAULT 'unipersonal',
    "telefonosucursales" VARCHAR(20),
    "emailsucursales" VARCHAR(200),
    "horario_aperturasucursales" TIME(6),
    "horario_cierresucursales" TIME(6),
    "activosucursales" BOOLEAN NOT NULL DEFAULT true,
    "created_atsucursales" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_atsucursales" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_atsucursales" TIMESTAMPTZ(6),

    CONSTRAINT "sucursales_pkey" PRIMARY KEY ("idsucursales")
);

-- CreateTable
CREATE TABLE "equipos_autorizados" (
    "idequipos_autorizados" SERIAL NOT NULL,
    "sucursales_idsucursales" INTEGER NOT NULL,
    "mac_addressequipos_autorizados" VARCHAR(30) NOT NULL,
    "nombreequipos_autorizados" VARCHAR(100),
    "sistema_operativoequipos_autorizados" "sistema_operativo_equipo",
    "activoequipos_autorizados" BOOLEAN NOT NULL DEFAULT true,
    "created_atequipos_autorizados" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_atequipos_autorizados" TIMESTAMPTZ(6),

    CONSTRAINT "equipos_autorizados_pkey" PRIMARY KEY ("idequipos_autorizados")
);

-- CreateTable
CREATE TABLE "documentos" (
    "iddocumentos" SERIAL NOT NULL,
    "sucursales_idsucursales" INTEGER NOT NULL,
    "descripciondocumentos" VARCHAR(100) NOT NULL,
    "prefijodocumentos" VARCHAR(10) NOT NULL,
    "desdedocumentos" INTEGER NOT NULL,
    "hastadocumentos" INTEGER NOT NULL,
    "ultimodocumentos" INTEGER NOT NULL DEFAULT 0,
    "resoluciondocumentos" VARCHAR(80),
    "activodocumentos" BOOLEAN NOT NULL DEFAULT true,
    "created_atdocumentos" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_atdocumentos" TIMESTAMPTZ(6),

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("iddocumentos")
);

-- CreateTable
CREATE TABLE "roles" (
    "idroles" SERIAL NOT NULL,
    "codigoroles" VARCHAR(40) NOT NULL,
    "nombreroles" VARCHAR(100) NOT NULL,
    "activoroles" BOOLEAN NOT NULL DEFAULT true,
    "created_atroles" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_atroles" TIMESTAMPTZ(6),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("idroles")
);

-- CreateTable
CREATE TABLE "permisos" (
    "idpermisos" SERIAL NOT NULL,
    "codigopermisos" VARCHAR(100) NOT NULL,
    "descripcionpermisos" VARCHAR(200),
    "modulopermisos" VARCHAR(50) NOT NULL,
    "deleted_atpermisos" TIMESTAMPTZ(6),

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("idpermisos")
);

-- CreateTable
CREATE TABLE "roles_permisos" (
    "roles_idroles" INTEGER NOT NULL,
    "permisos_idpermisos" INTEGER NOT NULL,

    CONSTRAINT "roles_permisos_pkey" PRIMARY KEY ("roles_idroles","permisos_idpermisos")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "idusuarios" SERIAL NOT NULL,
    "sucursales_idsucursales" INTEGER,
    "roles_idroles" INTEGER NOT NULL,
    "nombreusuarios" VARCHAR(200) NOT NULL,
    "emailusuarios" VARCHAR(200) NOT NULL,
    "password_hashusuarios" VARCHAR(500) NOT NULL,
    "activousuarios" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_loginusuarios" TIMESTAMPTZ(6),
    "created_atusuarios" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_atusuarios" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_atusuarios" TIMESTAMPTZ(6),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("idusuarios")
);

-- CreateTable
CREATE TABLE "tipos_cliente" (
    "idtipos_cliente" SERIAL NOT NULL,
    "comercios_idcomercios" INTEGER,
    "codigotipos_cliente" VARCHAR(30) NOT NULL,
    "nombretipos_cliente" VARCHAR(100) NOT NULL,
    "descuento_porcentajetipos_cliente" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "aplica_estampillastipos_cliente" BOOLEAN NOT NULL DEFAULT false,
    "aplica_giros_sisbentipos_cliente" BOOLEAN NOT NULL DEFAULT false,
    "activotipos_cliente" BOOLEAN NOT NULL DEFAULT true,
    "vigencia_iniciotipos_cliente" DATE,
    "vigencia_fintipos_cliente" DATE,
    "created_attipos_cliente" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_attipos_cliente" TIMESTAMPTZ(6),

    CONSTRAINT "tipos_cliente_pkey" PRIMARY KEY ("idtipos_cliente")
);

-- CreateTable
CREATE TABLE "productos" (
    "idproductos" SERIAL NOT NULL,
    "codigoproductos" VARCHAR(50) NOT NULL,
    "nombreproductos" VARCHAR(200) NOT NULL,
    "descripcionproductos" TEXT,
    "tipoproductos" "tipo_producto" NOT NULL,
    "precioproductos" DECIMAL(18,2) NOT NULL,
    "precio_sin_taxproductos" DECIMAL(18,2),
    "porcentaje_taxproductos" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "pesoproductos" DECIMAL(8,3),
    "factor_volumetricoproductos" DECIMAL(8,4),
    "imagen_urlproductos" VARCHAR(500),
    "activoproductos" BOOLEAN NOT NULL DEFAULT true,
    "created_atproductos" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_atproductos" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_atproductos" TIMESTAMPTZ(6),

    CONSTRAINT "productos_pkey" PRIMARY KEY ("idproductos")
);

-- CreateTable
CREATE TABLE "productos_sucursal" (
    "sucursales_idsucursales" INTEGER NOT NULL,
    "productos_idproductos" INTEGER NOT NULL,
    "activoproductos_sucursal" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "productos_sucursal_pkey" PRIMARY KEY ("sucursales_idsucursales","productos_idproductos")
);

-- CreateTable
CREATE TABLE "tarifas_producto" (
    "idtarifas_producto" SERIAL NOT NULL,
    "productos_idproductos" INTEGER NOT NULL,
    "tipos_cliente_idtipos_cliente" INTEGER NOT NULL,
    "preciotarifas_producto" DECIMAL(18,2) NOT NULL,
    "activotarifas_producto" BOOLEAN NOT NULL DEFAULT true,
    "vigencia_iniciotarifas_producto" DATE,
    "vigencia_fintarifas_producto" DATE,
    "created_attarifas_producto" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_attarifas_producto" TIMESTAMPTZ(6),

    CONSTRAINT "tarifas_producto_pkey" PRIMARY KEY ("idtarifas_producto")
);

-- CreateTable
CREATE TABLE "servicios" (
    "idservicios" SERIAL NOT NULL,
    "codigoservicios" VARCHAR(50) NOT NULL,
    "nombreservicios" VARCHAR(200) NOT NULL,
    "descripcionservicios" TEXT,
    "tiposervicios" "tipo_servicio_envio" NOT NULL,
    "requiere_estampillaservicios" BOOLEAN NOT NULL DEFAULT false,
    "requiere_dimensionesservicios" BOOLEAN NOT NULL DEFAULT false,
    "requiere_valor_declaradoservicios" BOOLEAN NOT NULL DEFAULT false,
    "peso_maximo_kgservicios" DECIMAL(8,3),
    "factor_volumetricoservicios" INTEGER NOT NULL DEFAULT 2500,
    "tiempo_entrega_diasservicios" INTEGER,
    "codigo_sigmaservicios" VARCHAR(50),
    "activoservicios" BOOLEAN NOT NULL DEFAULT true,
    "created_atservicios" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_atservicios" TIMESTAMPTZ(6),

    CONSTRAINT "servicios_pkey" PRIMARY KEY ("idservicios")
);

-- CreateTable
CREATE TABLE "servicios_sucursal" (
    "sucursales_idsucursales" INTEGER NOT NULL,
    "servicios_idservicios" INTEGER NOT NULL,
    "activoservicios_sucursal" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "servicios_sucursal_pkey" PRIMARY KEY ("sucursales_idsucursales","servicios_idservicios")
);

-- CreateTable
CREATE TABLE "tarifas_servicio" (
    "idtarifas_servicio" SERIAL NOT NULL,
    "servicios_idservicios" INTEGER NOT NULL,
    "tipos_cliente_idtipos_cliente" INTEGER,
    "pais_destinotarifas_servicio" VARCHAR(5) NOT NULL DEFAULT 'CO',
    "ciudad_destinotarifas_servicio" VARCHAR(100),
    "peso_min_kgtarifas_servicio" DECIMAL(8,3) NOT NULL DEFAULT 0,
    "peso_max_kgtarifas_servicio" DECIMAL(8,3),
    "tarifatarifas_servicio" DECIMAL(18,2) NOT NULL,
    "tarifa_kg_adicionaltarifas_servicio" DECIMAL(18,2),
    "activatarifas_servicio" BOOLEAN NOT NULL DEFAULT true,
    "fecha_vigencia_iniciotarifas_servicio" DATE,
    "fecha_vigencia_fintarifas_servicio" DATE,
    "created_attarifas_servicio" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_attarifas_servicio" TIMESTAMPTZ(6),

    CONSTRAINT "tarifas_servicio_pkey" PRIMARY KEY ("idtarifas_servicio")
);

-- CreateTable
CREATE TABLE "clientes" (
    "idclientes" SERIAL NOT NULL,
    "comercios_idcomercios" INTEGER,
    "tipo_documentoclientes" "tipo_documento_identidad" NOT NULL,
    "numero_documentoclientes" VARCHAR(30) NOT NULL,
    "nombreclientes" VARCHAR(150) NOT NULL,
    "apellidoclientes" VARCHAR(150),
    "emailclientes" VARCHAR(200),
    "telefonoclientes" VARCHAR(20),
    "direccionclientes" TEXT,
    "ciudadclientes" VARCHAR(100),
    "codigo_postalclientes" VARCHAR(20),
    "tipos_cliente_idtipos_cliente" INTEGER,
    "nivel_sisbenclientes" INTEGER,
    "envios_sisben_anoclientes" INTEGER NOT NULL DEFAULT 0,
    "activoclientes" BOOLEAN NOT NULL DEFAULT true,
    "created_atclientes" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_atclientes" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_atclientes" TIMESTAMPTZ(6),

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("idclientes")
);

-- CreateTable
CREATE TABLE "cajas_padres" (
    "idcajas_padres" SERIAL NOT NULL,
    "sucursales_idsucursales" INTEGER NOT NULL,
    "nombrecajas_padres" VARCHAR(100) NOT NULL,
    "base_generalcajas_padres" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "hora_resetcajas_padres" TIME(6),
    "created_atcajas_padres" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_atcajas_padres" TIMESTAMPTZ(6),

    CONSTRAINT "cajas_padres_pkey" PRIMARY KEY ("idcajas_padres")
);

-- CreateTable
CREATE TABLE "cajas" (
    "idcajas" SERIAL NOT NULL,
    "sucursales_idsucursales" INTEGER NOT NULL,
    "cajas_padres_idcajas_padres" INTEGER,
    "codigocajas" VARCHAR(20) NOT NULL,
    "nombrecajas" VARCHAR(100) NOT NULL,
    "tipocajas" "tipo_caja" NOT NULL,
    "base_diacajas" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "limite_alertacajas" DECIMAL(18,2),
    "activocajas" BOOLEAN NOT NULL DEFAULT true,
    "created_atcajas" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_atcajas" TIMESTAMPTZ(6),

    CONSTRAINT "cajas_pkey" PRIMARY KEY ("idcajas")
);

-- CreateTable
CREATE TABLE "sesiones_caja" (
    "idsesiones_caja" SERIAL NOT NULL,
    "cajas_idcajas" INTEGER NOT NULL,
    "usuarios_idusuarios_apertura" INTEGER NOT NULL,
    "usuarios_idusuarios_cierre" INTEGER,
    "equipo_macsesiones_caja" VARCHAR(30),
    "monto_aperturasesiones_caja" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "monto_cierrasesiones_caja" DECIMAL(18,2),
    "fecha_aperturasesiones_caja" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_cierrasesiones_caja" TIMESTAMPTZ(6),
    "cierre_forzadosesiones_caja" BOOLEAN NOT NULL DEFAULT false,
    "estadosesiones_caja" "estado_sesion_caja" NOT NULL DEFAULT 'abierta',
    "observacionessesiones_caja" TEXT,

    CONSTRAINT "sesiones_caja_pkey" PRIMARY KEY ("idsesiones_caja")
);

-- CreateTable
CREATE TABLE "movimientos_caja" (
    "idmovimientos_caja" SERIAL NOT NULL,
    "sesiones_caja_idsesiones_caja" INTEGER NOT NULL,
    "tipomovimientos_caja" "tipo_movimiento_caja" NOT NULL,
    "montomovimientos_caja" DECIMAL(18,2) NOT NULL,
    "medio_pagomovimientos_caja" "medio_pago",
    "referencia_idmovimientos_caja" INTEGER,
    "referencia_tipomovimientos_caja" VARCHAR(50),
    "descripcionmovimientos_caja" TEXT,
    "created_atmovimientos_caja" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_caja_pkey" PRIMARY KEY ("idmovimientos_caja")
);

-- CreateTable
CREATE TABLE "consignaciones" (
    "idconsignaciones" SERIAL NOT NULL,
    "sesiones_caja_idsesiones_caja" INTEGER NOT NULL,
    "usuarios_idusuarios" INTEGER NOT NULL,
    "medioconsignaciones" "medio_consignacion" NOT NULL,
    "banco_nombreconsignaciones" VARCHAR(100),
    "tipo_cuentaconsignaciones" "tipo_cuenta_bancaria",
    "numero_cuentaconsignaciones" VARCHAR(30),
    "montoconsignaciones" DECIMAL(18,2) NOT NULL,
    "propositoconsignaciones" TEXT,
    "soporte_urlconsignaciones" VARCHAR(500),
    "estadoconsignaciones" "estado_aprobacion" NOT NULL DEFAULT 'pendiente',
    "usuarios_idusuarios_aprobador" INTEGER,
    "fecha_aprobacionconsignaciones" TIMESTAMPTZ(6),
    "created_atconsignaciones" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consignaciones_pkey" PRIMARY KEY ("idconsignaciones")
);

-- CreateTable
CREATE TABLE "reposiciones_caja" (
    "idreposiciones_caja" SERIAL NOT NULL,
    "sesiones_caja_idsesiones_caja_origen" INTEGER NOT NULL,
    "sesiones_caja_idsesiones_caja_destino" INTEGER NOT NULL,
    "montoreposiciones_caja" DECIMAL(18,2) NOT NULL,
    "usuarios_idusuarios" INTEGER,
    "estadoreposiciones_caja" "estado_aprobacion" NOT NULL DEFAULT 'pendiente',
    "motivoreposiciones_caja" TEXT,
    "created_atreposiciones_caja" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reposiciones_caja_pkey" PRIMARY KEY ("idreposiciones_caja")
);

-- CreateTable
CREATE TABLE "ventas" (
    "idventas" SERIAL NOT NULL,
    "sesiones_caja_idsesiones_caja" INTEGER NOT NULL,
    "usuarios_idusuarios" INTEGER NOT NULL,
    "clientes_idclientes" INTEGER,
    "documentos_iddocumentos" INTEGER,
    "numero_docventas" VARCHAR(30),
    "subtotalventas" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "descuentoventas" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "ivaventas" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalventas" DECIMAL(18,2) NOT NULL,
    "medio_pagoventas" "medio_pago" NOT NULL,
    "estadoventas" "estado_venta" NOT NULL DEFAULT 'activa',
    "created_atventas" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_atventas" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("idventas")
);

-- CreateTable
CREATE TABLE "ventas_detalle" (
    "idventas_detalle" SERIAL NOT NULL,
    "ventas_idventas" INTEGER NOT NULL,
    "productos_idproductos" INTEGER NOT NULL,
    "cantidadventas_detalle" INTEGER NOT NULL,
    "precio_unitarioventas_detalle" DECIMAL(18,2) NOT NULL,
    "descuentoventas_detalle" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "subtotalventas_detalle" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "ventas_detalle_pkey" PRIMARY KEY ("idventas_detalle")
);

-- CreateTable
CREATE TABLE "envios" (
    "idenvios" SERIAL NOT NULL,
    "numero_guiaenvios" VARCHAR(50) NOT NULL,
    "tipoenvios" "tipo_envio" NOT NULL,
    "es_correspondenciaenvios" BOOLEAN NOT NULL DEFAULT false,
    "sucursales_idsucursales" INTEGER NOT NULL,
    "sesiones_caja_idsesiones_caja" INTEGER,
    "usuarios_idusuarios" INTEGER NOT NULL,
    "clientes_idclientes" INTEGER,
    "servicios_idservicios" INTEGER NOT NULL,
    "remitente_nombreenvios" VARCHAR(300),
    "remitente_documentoenvios" VARCHAR(30),
    "remitente_emailenvios" VARCHAR(200),
    "remitente_telefonoenvios" VARCHAR(20),
    "remitente_direccionenvios" TEXT,
    "remitente_ciudadenvios" VARCHAR(100),
    "remitente_codigo_postalenvios" VARCHAR(20),
    "destinatario_nombreenvios" VARCHAR(300),
    "destinatario_documentoenvios" VARCHAR(30),
    "destinatario_tiene_docenvios" BOOLEAN NOT NULL DEFAULT true,
    "destinatario_emailenvios" VARCHAR(200),
    "destinatario_telefonoenvios" VARCHAR(20),
    "destinatario_direccionenvios" TEXT,
    "destinatario_ciudadenvios" VARCHAR(100),
    "destinatario_paisenvios" VARCHAR(5) NOT NULL DEFAULT 'CO',
    "destinatario_codigo_postalenvios" VARCHAR(20),
    "peso_fisico_kgenvios" DECIMAL(8,3) NOT NULL,
    "alto_cmenvios" DECIMAL(8,2),
    "ancho_cmenvios" DECIMAL(8,2),
    "largo_cmenvios" DECIMAL(8,2),
    "peso_volumetrico_kgenvios" DECIMAL(8,3),
    "peso_tarificado_kgenvios" DECIMAL(8,3) NOT NULL,
    "valor_declaradoenvios" DECIMAL(18,2),
    "observacionesenvios" TEXT,
    "valor_servicioenvios" DECIMAL(18,2) NOT NULL,
    "valor_estampillasenvios" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "valor_seguroenvios" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "valor_totalenvios" DECIMAL(18,2) NOT NULL,
    "medio_pagoenvios" "medio_pago",
    "estadoenvios" "estado_envio" NOT NULL DEFAULT 'facturado',
    "numero_guia_fisicaenvios" VARCHAR(50),
    "proveedor_externeenvios" VARCHAR(50),
    "referencia_proveedorenvios" VARCHAR(100),
    "referencia_sigmaenvios" VARCHAR(100),
    "documentos_generadosenvios" JSONB NOT NULL DEFAULT '[]',
    "sincronizado_sigmaenvios" BOOLEAN NOT NULL DEFAULT false,
    "created_atenvios" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_atenvios" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "envios_pkey" PRIMARY KEY ("idenvios")
);

-- CreateTable
CREATE TABLE "envios_items" (
    "idenvios_items" SERIAL NOT NULL,
    "envios_idenvios" INTEGER NOT NULL,
    "productos_idproductos" INTEGER NOT NULL,
    "cantidadenvios_items" INTEGER NOT NULL,
    "precio_unitarioenvios_items" DECIMAL(18,2) NOT NULL,
    "subtotalenvios_items" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "envios_items_pkey" PRIMARY KEY ("idenvios_items")
);

-- CreateTable
CREATE TABLE "facturas" (
    "idfacturas" SERIAL NOT NULL,
    "tipofacturas" "tipo_factura" NOT NULL,
    "numerofacturas" VARCHAR(50) NOT NULL,
    "prefijofacturas" VARCHAR(10),
    "referencia_idfacturas" INTEGER NOT NULL,
    "referencia_tipofacturas" VARCHAR(50) NOT NULL,
    "sesiones_caja_idsesiones_caja" INTEGER,
    "clientes_idclientes" INTEGER,
    "subtotalfacturas" DECIMAL(18,2) NOT NULL,
    "impuestosfacturas" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalfacturas" DECIMAL(18,2) NOT NULL,
    "cufefacturas" VARCHAR(500),
    "estadofacturas" "estado_factura" NOT NULL DEFAULT 'emitida',
    "enviada_dianfacturas" BOOLEAN NOT NULL DEFAULT false,
    "cola_dian_idfacturas" VARCHAR(100),
    "created_atfacturas" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "facturas_pkey" PRIMARY KEY ("idfacturas")
);

-- CreateTable
CREATE TABLE "facturas_items" (
    "idfacturas_items" SERIAL NOT NULL,
    "facturas_idfacturas" INTEGER NOT NULL,
    "descripcionfacturas_items" VARCHAR(300) NOT NULL,
    "cantidadfacturas_items" INTEGER NOT NULL DEFAULT 1,
    "valor_unitariofacturas_items" DECIMAL(18,2) NOT NULL,
    "valor_totalfacturas_items" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "facturas_items_pkey" PRIMARY KEY ("idfacturas_items")
);

-- CreateTable
CREATE TABLE "inventario_sucursal" (
    "idinventario_sucursal" SERIAL NOT NULL,
    "sucursales_idsucursales" INTEGER NOT NULL,
    "productos_idproductos" INTEGER NOT NULL,
    "cantidad_actualinventario_sucursal" INTEGER NOT NULL DEFAULT 0,
    "cantidad_minimainventario_sucursal" INTEGER NOT NULL DEFAULT 5,
    "updated_atinventario_sucursal" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventario_sucursal_pkey" PRIMARY KEY ("idinventario_sucursal")
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "idmovimientos_inventario" SERIAL NOT NULL,
    "sucursales_idsucursales" INTEGER NOT NULL,
    "productos_idproductos" INTEGER NOT NULL,
    "tipomovimientos_inventario" "tipo_movimiento_inventario" NOT NULL,
    "cantidadmovimientos_inventario" INTEGER NOT NULL,
    "cantidad_anteriormovimientos_inventario" INTEGER NOT NULL,
    "cantidad_posteriormovimientos_inventario" INTEGER NOT NULL,
    "referencia_idmovimientos_inventario" INTEGER,
    "referencia_tipomovimientos_inventario" VARCHAR(50),
    "usuarios_idusuarios" INTEGER,
    "observacionmovimientos_inventario" TEXT,
    "created_atmovimientos_inventario" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("idmovimientos_inventario")
);

-- CreateTable
CREATE TABLE "ordenes_inventario" (
    "idordenes_inventario" SERIAL NOT NULL,
    "sucursales_idsucursales" INTEGER NOT NULL,
    "estadoordenes_inventario" "estado_orden_inventario" NOT NULL DEFAULT 'pendiente',
    "usuarios_idusuarios_creador" INTEGER,
    "usuarios_idusuarios_confirmador" INTEGER,
    "fecha_confirmacionordenes_inventario" TIMESTAMPTZ(6),
    "observacionesordenes_inventario" TEXT,
    "created_atordenes_inventario" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ordenes_inventario_pkey" PRIMARY KEY ("idordenes_inventario")
);

-- CreateTable
CREATE TABLE "ordenes_inventario_items" (
    "idordenes_inventario_items" SERIAL NOT NULL,
    "ordenes_inventario_idordenes_inventario" INTEGER NOT NULL,
    "productos_idproductos" INTEGER NOT NULL,
    "cantidad_enviadaordenes_inventario_items" INTEGER NOT NULL,
    "cantidad_recibidaordenes_inventario_items" INTEGER,
    "estadoordenes_inventario_items" "estado_orden_inventario_item" NOT NULL DEFAULT 'pendiente',

    CONSTRAINT "ordenes_inventario_items_pkey" PRIMARY KEY ("idordenes_inventario_items")
);

-- CreateTable
CREATE TABLE "sacas" (
    "idsacas" SERIAL NOT NULL,
    "numero_precintosacas" VARCHAR(50) NOT NULL,
    "sucursales_idsucursales" INTEGER NOT NULL,
    "sesiones_caja_idsesiones_caja" INTEGER,
    "usuarios_idusuarios" INTEGER NOT NULL,
    "tiposacas" "tipo_saca" NOT NULL,
    "tipo_sacasacas" "tipo_consolidacion_saca" NOT NULL DEFAULT 'consolidada',
    "centro_operativo_destinosacas" VARCHAR(100),
    "estadosacas" "estado_saca" NOT NULL DEFAULT 'abierta',
    "peso_kgsacas" DECIMAL(8,3),
    "total_enviossacas" INTEGER NOT NULL DEFAULT 0,
    "transportista_nombresacas" VARCHAR(200),
    "transportista_firmasacas" BOOLEAN NOT NULL DEFAULT false,
    "fecha_despachosacas" TIMESTAMPTZ(6),
    "created_atsacas" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerrada_atsacas" TIMESTAMPTZ(6),

    CONSTRAINT "sacas_pkey" PRIMARY KEY ("idsacas")
);

-- CreateTable
CREATE TABLE "envios_saca" (
    "idenvios_saca" SERIAL NOT NULL,
    "sacas_idsacas" INTEGER NOT NULL,
    "envios_idenvios" INTEGER NOT NULL,
    "created_atenvios_saca" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "envios_saca_pkey" PRIMARY KEY ("idenvios_saca")
);

-- CreateTable
CREATE TABLE "apartados_postales" (
    "idapartados_postales" SERIAL NOT NULL,
    "sucursales_idsucursales" INTEGER NOT NULL,
    "numeroapartados_postales" VARCHAR(20) NOT NULL,
    "tamanoapartados_postales" "tamano_apartado_postal" NOT NULL DEFAULT 'pequeno',
    "estadoapartados_postales" "estado_apartado_postal" NOT NULL DEFAULT 'disponible',
    "clientes_idclientes" INTEGER,
    "fecha_inicioapartados_postales" DATE,
    "fecha_finapartados_postales" DATE,
    "valorapartados_postales" DECIMAL(18,2),
    "incluye_ivaapartados_postales" BOOLEAN NOT NULL DEFAULT true,
    "dias_alerta_vencimientoapartados_postales" INTEGER NOT NULL DEFAULT 30,
    "sesiones_caja_idsesiones_caja" INTEGER,
    "created_atapartados_postales" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_atapartados_postales" TIMESTAMPTZ(6),

    CONSTRAINT "apartados_postales_pkey" PRIMARY KEY ("idapartados_postales")
);

-- CreateTable
CREATE TABLE "giros" (
    "idgiros" SERIAL NOT NULL,
    "tipogiros" "tipo_giro" NOT NULL,
    "operaciongiros" "operacion_giro" NOT NULL,
    "sucursales_idsucursales" INTEGER NOT NULL,
    "sesiones_caja_idsesiones_caja" INTEGER,
    "usuarios_idusuarios" INTEGER NOT NULL,
    "clientes_idclientes_remitente" INTEGER,
    "remitente_tipo_docgiros" VARCHAR(20),
    "remitente_numero_docgiros" VARCHAR(30),
    "remitente_nombregiros" VARCHAR(300),
    "remitente_fecha_exp_docgiros" DATE,
    "remitente_ciudadgiros" VARCHAR(100),
    "remitente_direcciongiros" TEXT,
    "remitente_emailgiros" VARCHAR(200),
    "remitente_huellagiros" BOOLEAN NOT NULL DEFAULT false,
    "beneficiario_tipo_docgiros" VARCHAR(20),
    "beneficiario_numero_docgiros" VARCHAR(30),
    "beneficiario_nombregiros" VARCHAR(300),
    "beneficiario_fecha_nacgiros" DATE,
    "beneficiario_paisgiros" VARCHAR(5) NOT NULL DEFAULT 'CO',
    "beneficiario_estadogiros" VARCHAR(100),
    "beneficiario_ciudadgiros" VARCHAR(100),
    "sucursales_idsucursales_beneficiario" INTEGER,
    "beneficiario_direcciongiros" TEXT,
    "beneficiario_telefonogiros" VARCHAR(20),
    "beneficiario_mensajegiros" TEXT,
    "monto_copgiros" DECIMAL(18,2) NOT NULL,
    "flete_copgiros" DECIMAL(18,2) NOT NULL DEFAULT 4700,
    "flete_asumido_porgiros" "flete_asumido_giro",
    "monto_total_copgiros" DECIMAL(18,2) NOT NULL,
    "monto_destinogiros" DECIMAL(18,2),
    "moneda_destinogiros" VARCHAR(5) NOT NULL DEFAULT 'COP',
    "tasa_cambiogiros" DECIMAL(18,6),
    "pingiros" VARCHAR(20),
    "numero_referenciagiros" VARCHAR(50),
    "referencia_proveedorgiros" VARCHAR(100),
    "consulta_inspektorgiros" BOOLEAN NOT NULL DEFAULT false,
    "resultado_inspektorgiros" "resultado_inspektor",
    "inspektor_referenciagiros" VARCHAR(100),
    "estadogiros" "estado_giro" NOT NULL DEFAULT 'pendiente',
    "formulario_5giros" BOOLEAN NOT NULL DEFAULT false,
    "declaracion_origengiros" BOOLEAN NOT NULL DEFAULT false,
    "fotocopia_cedulagiros" BOOLEAN NOT NULL DEFAULT false,
    "reportado_minticgiros" BOOLEAN NOT NULL DEFAULT false,
    "created_atgiros" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_atgiros" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "giros_pkey" PRIMARY KEY ("idgiros")
);

-- CreateTable
CREATE TABLE "convenios_recaudo" (
    "idconvenios_recaudo" SERIAL NOT NULL,
    "codigoconvenios_recaudo" VARCHAR(50) NOT NULL,
    "nombreconvenios_recaudo" VARCHAR(200) NOT NULL,
    "descripcionconvenios_recaudo" TEXT,
    "tipo_apiconvenios_recaudo" "tipo_api_convenio",
    "activoconvenios_recaudo" BOOLEAN NOT NULL DEFAULT true,
    "created_atconvenios_recaudo" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_atconvenios_recaudo" TIMESTAMPTZ(6),

    CONSTRAINT "convenios_recaudo_pkey" PRIMARY KEY ("idconvenios_recaudo")
);

-- CreateTable
CREATE TABLE "convenios_sucursal" (
    "sucursales_idsucursales" INTEGER NOT NULL,
    "convenios_recaudo_idconvenios_recaudo" INTEGER NOT NULL,
    "activoconvenios_sucursal" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "convenios_sucursal_pkey" PRIMARY KEY ("sucursales_idsucursales","convenios_recaudo_idconvenios_recaudo")
);

-- CreateTable
CREATE TABLE "recaudos" (
    "idrecaudos" SERIAL NOT NULL,
    "convenios_recaudo_idconvenios_recaudo" INTEGER NOT NULL,
    "sucursales_idsucursales" INTEGER NOT NULL,
    "sesiones_caja_idsesiones_caja" INTEGER,
    "usuarios_idusuarios" INTEGER NOT NULL,
    "clientes_idclientes" INTEGER,
    "referencia_pagorecaudos" VARCHAR(100) NOT NULL,
    "codigo_barrasrecaudos" VARCHAR(200),
    "montorecaudos" DECIMAL(18,2) NOT NULL,
    "estadorecaudos" "estado_recaudo" NOT NULL DEFAULT 'exitoso',
    "created_atrecaudos" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recaudos_pkey" PRIMARY KEY ("idrecaudos")
);

-- CreateTable
CREATE TABLE "listas_restrictivas" (
    "idlistas_restrictivas" SERIAL NOT NULL,
    "tipo_documentolistas_restrictivas" VARCHAR(20) NOT NULL,
    "numero_documentolistas_restrictivas" VARCHAR(30) NOT NULL,
    "nombrelistas_restrictivas" VARCHAR(300),
    "tipo_listalistas_restrictivas" "tipo_lista_restrictiva" NOT NULL,
    "motivolistas_restrictivas" TEXT,
    "activolistas_restrictivas" BOOLEAN NOT NULL DEFAULT true,
    "fuentelistas_restrictivas" VARCHAR(100),
    "created_atlistas_restrictivas" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_atlistas_restrictivas" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_atlistas_restrictivas" TIMESTAMPTZ(6),

    CONSTRAINT "listas_restrictivas_pkey" PRIMARY KEY ("idlistas_restrictivas")
);

-- CreateTable
CREATE TABLE "consultas_inspektor" (
    "idconsultas_inspektor" SERIAL NOT NULL,
    "tipo_documentoconsultas_inspektor" VARCHAR(20) NOT NULL,
    "numero_documentoconsultas_inspektor" VARCHAR(30) NOT NULL,
    "resultadoconsultas_inspektor" "resultado_inspektor" NOT NULL,
    "giros_idgiros" INTEGER,
    "usuarios_idusuarios" INTEGER,
    "respuesta_rawconsultas_inspektor" JSONB,
    "created_atconsultas_inspektor" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultas_inspektor_pkey" PRIMARY KEY ("idconsultas_inspektor")
);

-- CreateTable
CREATE TABLE "alertas" (
    "idalertas" SERIAL NOT NULL,
    "tipoalertas" "tipo_alerta" NOT NULL,
    "sucursales_idsucursales" INTEGER,
    "referencia_idalertas" INTEGER NOT NULL,
    "referencia_tipoalertas" VARCHAR(50) NOT NULL,
    "mensajealertas" TEXT NOT NULL,
    "datos_adicionalesalertas" JSONB NOT NULL DEFAULT '{}',
    "estadoalertas" "estado_alerta" NOT NULL DEFAULT 'pendiente',
    "usuarios_idusuarios_creador" INTEGER,
    "usuarios_idusuarios_resolutor" INTEGER,
    "fecha_resolucionalertas" TIMESTAMPTZ(6),
    "created_atalertas" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alertas_pkey" PRIMARY KEY ("idalertas")
);

-- CreateTable
CREATE TABLE "anulaciones" (
    "idanulaciones" SERIAL NOT NULL,
    "referencia_idanulaciones" INTEGER NOT NULL,
    "referencia_tipoanulaciones" VARCHAR(50) NOT NULL,
    "motivoanulaciones" TEXT NOT NULL,
    "usuarios_idusuarios_solicitante" INTEGER,
    "usuarios_idusuarios_aprobador" INTEGER,
    "estadoanulaciones" "estado_aprobacion" NOT NULL DEFAULT 'pendiente',
    "created_atanulaciones" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resuelta_atanulaciones" TIMESTAMPTZ(6),

    CONSTRAINT "anulaciones_pkey" PRIMARY KEY ("idanulaciones")
);

-- CreateTable
CREATE TABLE "eventos_auditoria" (
    "ideventos_auditoria" SERIAL NOT NULL,
    "usuarios_idusuarios" INTEGER,
    "sucursales_idsucursales" INTEGER,
    "tablaeventos_auditoria" VARCHAR(100) NOT NULL,
    "operacioneventos_auditoria" "operacion_auditoria" NOT NULL,
    "registro_ideventos_auditoria" INTEGER NOT NULL,
    "datos_anteseventos_auditoria" JSONB,
    "datos_despueseventos_auditoria" JSONB,
    "ip_origeneventos_auditoria" INET,
    "mac_origeneventos_auditoria" VARCHAR(30),
    "created_ateventos_auditoria" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_auditoria_pkey" PRIMARY KEY ("ideventos_auditoria")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "idfeature_flags" SERIAL NOT NULL,
    "codigofeature_flags" VARCHAR(100) NOT NULL,
    "descripcionfeature_flags" VARCHAR(200),
    "activofeature_flags" BOOLEAN NOT NULL DEFAULT false,
    "entornofeature_flags" "entorno_feature_flag" NOT NULL DEFAULT 'all',
    "created_atfeature_flags" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_atfeature_flags" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("idfeature_flags")
);

-- CreateIndex
CREATE UNIQUE INDEX "comercios_codigocomercios_key" ON "comercios"("codigocomercios");

-- CreateIndex
CREATE UNIQUE INDEX "comercios_nitcomercios_key" ON "comercios"("nitcomercios");

-- CreateIndex
CREATE UNIQUE INDEX "regionales_codigoregionales_key" ON "regionales"("codigoregionales");

-- CreateIndex
CREATE UNIQUE INDEX "sucursales_codigosucursales_key" ON "sucursales"("codigosucursales");

-- CreateIndex
CREATE UNIQUE INDEX "equipos_autorizados_mac_addressequipos_autorizados_key" ON "equipos_autorizados"("mac_addressequipos_autorizados");

-- CreateIndex
CREATE UNIQUE INDEX "roles_codigoroles_key" ON "roles"("codigoroles");

-- CreateIndex
CREATE UNIQUE INDEX "permisos_codigopermisos_key" ON "permisos"("codigopermisos");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_emailusuarios_key" ON "usuarios"("emailusuarios");

-- CreateIndex
CREATE INDEX "usuarios_sucursales_idsucursales_idx" ON "usuarios"("sucursales_idsucursales");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_cliente_codigotipos_cliente_key" ON "tipos_cliente"("codigotipos_cliente");

-- CreateIndex
CREATE UNIQUE INDEX "productos_codigoproductos_key" ON "productos"("codigoproductos");

-- CreateIndex
CREATE UNIQUE INDEX "tarifas_producto_productos_idproductos_tipos_cliente_idtipo_key" ON "tarifas_producto"("productos_idproductos", "tipos_cliente_idtipos_cliente", "vigencia_iniciotarifas_producto");

-- CreateIndex
CREATE UNIQUE INDEX "servicios_codigoservicios_key" ON "servicios"("codigoservicios");

-- CreateIndex
CREATE INDEX "idx_tarifas_servicio_lookup" ON "tarifas_servicio"("servicios_idservicios", "activatarifas_servicio");

-- CreateIndex
CREATE INDEX "idx_clientes_doc" ON "clientes"("tipo_documentoclientes", "numero_documentoclientes");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_tipo_documentoclientes_numero_documentoclientes_key" ON "clientes"("tipo_documentoclientes", "numero_documentoclientes");

-- CreateIndex
CREATE UNIQUE INDEX "cajas_codigocajas_sucursales_idsucursales_key" ON "cajas"("codigocajas", "sucursales_idsucursales");

-- CreateIndex
CREATE INDEX "idx_sesiones_caja_estado" ON "sesiones_caja"("cajas_idcajas", "estadosesiones_caja");

-- CreateIndex
CREATE INDEX "idx_mov_caja_sesion" ON "movimientos_caja"("sesiones_caja_idsesiones_caja");

-- CreateIndex
CREATE INDEX "idx_ventas_sesion" ON "ventas"("sesiones_caja_idsesiones_caja");

-- CreateIndex
CREATE INDEX "idx_ventas_fecha" ON "ventas"("created_atventas");

-- CreateIndex
CREATE INDEX "idx_ventas_detalle_venta" ON "ventas_detalle"("ventas_idventas");

-- CreateIndex
CREATE UNIQUE INDEX "envios_numero_guiaenvios_key" ON "envios"("numero_guiaenvios");

-- CreateIndex
CREATE INDEX "idx_envios_sucursal_fecha" ON "envios"("sucursales_idsucursales", "created_atenvios");

-- CreateIndex
CREATE INDEX "idx_envios_guia" ON "envios"("numero_guiaenvios");

-- CreateIndex
CREATE INDEX "idx_envios_estado" ON "envios"("estadoenvios");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_numerofacturas_key" ON "facturas"("numerofacturas");

-- CreateIndex
CREATE INDEX "idx_facturas_fecha" ON "facturas"("created_atfacturas");

-- CreateIndex
CREATE INDEX "idx_facturas_ref" ON "facturas"("referencia_idfacturas", "referencia_tipofacturas");

-- CreateIndex
CREATE INDEX "idx_inventario_sucursal" ON "inventario_sucursal"("sucursales_idsucursales");

-- CreateIndex
CREATE UNIQUE INDEX "inventario_sucursal_sucursales_idsucursales_productos_idpro_key" ON "inventario_sucursal"("sucursales_idsucursales", "productos_idproductos");

-- CreateIndex
CREATE INDEX "idx_mov_inv_sucursal_fecha" ON "movimientos_inventario"("sucursales_idsucursales", "created_atmovimientos_inventario");

-- CreateIndex
CREATE INDEX "idx_sacas_sucursal_estado" ON "sacas"("sucursales_idsucursales", "estadosacas");

-- CreateIndex
CREATE UNIQUE INDEX "envios_saca_sacas_idsacas_envios_idenvios_key" ON "envios_saca"("sacas_idsacas", "envios_idenvios");

-- CreateIndex
CREATE UNIQUE INDEX "apartados_postales_sucursales_idsucursales_numeroapartados__key" ON "apartados_postales"("sucursales_idsucursales", "numeroapartados_postales");

-- CreateIndex
CREATE INDEX "idx_giros_sucursal_fecha" ON "giros"("sucursales_idsucursales", "created_atgiros");

-- CreateIndex
CREATE INDEX "idx_giros_pin" ON "giros"("pingiros");

-- CreateIndex
CREATE UNIQUE INDEX "convenios_recaudo_codigoconvenios_recaudo_key" ON "convenios_recaudo"("codigoconvenios_recaudo");

-- CreateIndex
CREATE INDEX "idx_recaudos_sucursal_fecha" ON "recaudos"("sucursales_idsucursales", "created_atrecaudos");

-- CreateIndex
CREATE INDEX "idx_listas_doc" ON "listas_restrictivas"("tipo_documentolistas_restrictivas", "numero_documentolistas_restrictivas");

-- CreateIndex
CREATE INDEX "idx_alertas_sucursal_estado" ON "alertas"("sucursales_idsucursales", "estadoalertas");

-- CreateIndex
CREATE INDEX "idx_auditoria_tabla_fecha" ON "eventos_auditoria"("tablaeventos_auditoria", "created_ateventos_auditoria");

-- CreateIndex
CREATE INDEX "idx_auditoria_usuario" ON "eventos_auditoria"("usuarios_idusuarios", "created_ateventos_auditoria");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_codigofeature_flags_key" ON "feature_flags"("codigofeature_flags");

-- AddForeignKey
ALTER TABLE "regionales" ADD CONSTRAINT "regionales_comercios_idcomercios_fkey" FOREIGN KEY ("comercios_idcomercios") REFERENCES "comercios"("idcomercios") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sucursales" ADD CONSTRAINT "sucursales_regionales_idregionales_fkey" FOREIGN KEY ("regionales_idregionales") REFERENCES "regionales"("idregionales") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipos_autorizados" ADD CONSTRAINT "equipos_autorizados_sucursales_idsucursales_fkey" FOREIGN KEY ("sucursales_idsucursales") REFERENCES "sucursales"("idsucursales") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_sucursales_idsucursales_fkey" FOREIGN KEY ("sucursales_idsucursales") REFERENCES "sucursales"("idsucursales") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_permisos" ADD CONSTRAINT "roles_permisos_roles_idroles_fkey" FOREIGN KEY ("roles_idroles") REFERENCES "roles"("idroles") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_permisos" ADD CONSTRAINT "roles_permisos_permisos_idpermisos_fkey" FOREIGN KEY ("permisos_idpermisos") REFERENCES "permisos"("idpermisos") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_sucursales_idsucursales_fkey" FOREIGN KEY ("sucursales_idsucursales") REFERENCES "sucursales"("idsucursales") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_roles_idroles_fkey" FOREIGN KEY ("roles_idroles") REFERENCES "roles"("idroles") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipos_cliente" ADD CONSTRAINT "tipos_cliente_comercios_idcomercios_fkey" FOREIGN KEY ("comercios_idcomercios") REFERENCES "comercios"("idcomercios") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_sucursal" ADD CONSTRAINT "productos_sucursal_sucursales_idsucursales_fkey" FOREIGN KEY ("sucursales_idsucursales") REFERENCES "sucursales"("idsucursales") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_sucursal" ADD CONSTRAINT "productos_sucursal_productos_idproductos_fkey" FOREIGN KEY ("productos_idproductos") REFERENCES "productos"("idproductos") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarifas_producto" ADD CONSTRAINT "tarifas_producto_productos_idproductos_fkey" FOREIGN KEY ("productos_idproductos") REFERENCES "productos"("idproductos") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarifas_producto" ADD CONSTRAINT "tarifas_producto_tipos_cliente_idtipos_cliente_fkey" FOREIGN KEY ("tipos_cliente_idtipos_cliente") REFERENCES "tipos_cliente"("idtipos_cliente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicios_sucursal" ADD CONSTRAINT "servicios_sucursal_sucursales_idsucursales_fkey" FOREIGN KEY ("sucursales_idsucursales") REFERENCES "sucursales"("idsucursales") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicios_sucursal" ADD CONSTRAINT "servicios_sucursal_servicios_idservicios_fkey" FOREIGN KEY ("servicios_idservicios") REFERENCES "servicios"("idservicios") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarifas_servicio" ADD CONSTRAINT "tarifas_servicio_servicios_idservicios_fkey" FOREIGN KEY ("servicios_idservicios") REFERENCES "servicios"("idservicios") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarifas_servicio" ADD CONSTRAINT "tarifas_servicio_tipos_cliente_idtipos_cliente_fkey" FOREIGN KEY ("tipos_cliente_idtipos_cliente") REFERENCES "tipos_cliente"("idtipos_cliente") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_comercios_idcomercios_fkey" FOREIGN KEY ("comercios_idcomercios") REFERENCES "comercios"("idcomercios") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_tipos_cliente_idtipos_cliente_fkey" FOREIGN KEY ("tipos_cliente_idtipos_cliente") REFERENCES "tipos_cliente"("idtipos_cliente") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajas_padres" ADD CONSTRAINT "cajas_padres_sucursales_idsucursales_fkey" FOREIGN KEY ("sucursales_idsucursales") REFERENCES "sucursales"("idsucursales") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajas" ADD CONSTRAINT "cajas_sucursales_idsucursales_fkey" FOREIGN KEY ("sucursales_idsucursales") REFERENCES "sucursales"("idsucursales") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajas" ADD CONSTRAINT "cajas_cajas_padres_idcajas_padres_fkey" FOREIGN KEY ("cajas_padres_idcajas_padres") REFERENCES "cajas_padres"("idcajas_padres") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_caja" ADD CONSTRAINT "sesiones_caja_cajas_idcajas_fkey" FOREIGN KEY ("cajas_idcajas") REFERENCES "cajas"("idcajas") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_caja" ADD CONSTRAINT "sesiones_caja_usuarios_idusuarios_apertura_fkey" FOREIGN KEY ("usuarios_idusuarios_apertura") REFERENCES "usuarios"("idusuarios") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesiones_caja" ADD CONSTRAINT "sesiones_caja_usuarios_idusuarios_cierre_fkey" FOREIGN KEY ("usuarios_idusuarios_cierre") REFERENCES "usuarios"("idusuarios") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_sesiones_caja_idsesiones_caja_fkey" FOREIGN KEY ("sesiones_caja_idsesiones_caja") REFERENCES "sesiones_caja"("idsesiones_caja") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consignaciones" ADD CONSTRAINT "consignaciones_sesiones_caja_idsesiones_caja_fkey" FOREIGN KEY ("sesiones_caja_idsesiones_caja") REFERENCES "sesiones_caja"("idsesiones_caja") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consignaciones" ADD CONSTRAINT "consignaciones_usuarios_idusuarios_fkey" FOREIGN KEY ("usuarios_idusuarios") REFERENCES "usuarios"("idusuarios") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consignaciones" ADD CONSTRAINT "consignaciones_usuarios_idusuarios_aprobador_fkey" FOREIGN KEY ("usuarios_idusuarios_aprobador") REFERENCES "usuarios"("idusuarios") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reposiciones_caja" ADD CONSTRAINT "reposiciones_caja_sesiones_caja_idsesiones_caja_origen_fkey" FOREIGN KEY ("sesiones_caja_idsesiones_caja_origen") REFERENCES "sesiones_caja"("idsesiones_caja") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reposiciones_caja" ADD CONSTRAINT "reposiciones_caja_sesiones_caja_idsesiones_caja_destino_fkey" FOREIGN KEY ("sesiones_caja_idsesiones_caja_destino") REFERENCES "sesiones_caja"("idsesiones_caja") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reposiciones_caja" ADD CONSTRAINT "reposiciones_caja_usuarios_idusuarios_fkey" FOREIGN KEY ("usuarios_idusuarios") REFERENCES "usuarios"("idusuarios") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_sesiones_caja_idsesiones_caja_fkey" FOREIGN KEY ("sesiones_caja_idsesiones_caja") REFERENCES "sesiones_caja"("idsesiones_caja") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_usuarios_idusuarios_fkey" FOREIGN KEY ("usuarios_idusuarios") REFERENCES "usuarios"("idusuarios") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_clientes_idclientes_fkey" FOREIGN KEY ("clientes_idclientes") REFERENCES "clientes"("idclientes") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_documentos_iddocumentos_fkey" FOREIGN KEY ("documentos_iddocumentos") REFERENCES "documentos"("iddocumentos") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_detalle" ADD CONSTRAINT "ventas_detalle_ventas_idventas_fkey" FOREIGN KEY ("ventas_idventas") REFERENCES "ventas"("idventas") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_detalle" ADD CONSTRAINT "ventas_detalle_productos_idproductos_fkey" FOREIGN KEY ("productos_idproductos") REFERENCES "productos"("idproductos") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envios" ADD CONSTRAINT "envios_sucursales_idsucursales_fkey" FOREIGN KEY ("sucursales_idsucursales") REFERENCES "sucursales"("idsucursales") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envios" ADD CONSTRAINT "envios_sesiones_caja_idsesiones_caja_fkey" FOREIGN KEY ("sesiones_caja_idsesiones_caja") REFERENCES "sesiones_caja"("idsesiones_caja") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envios" ADD CONSTRAINT "envios_usuarios_idusuarios_fkey" FOREIGN KEY ("usuarios_idusuarios") REFERENCES "usuarios"("idusuarios") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envios" ADD CONSTRAINT "envios_clientes_idclientes_fkey" FOREIGN KEY ("clientes_idclientes") REFERENCES "clientes"("idclientes") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envios" ADD CONSTRAINT "envios_servicios_idservicios_fkey" FOREIGN KEY ("servicios_idservicios") REFERENCES "servicios"("idservicios") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envios_items" ADD CONSTRAINT "envios_items_envios_idenvios_fkey" FOREIGN KEY ("envios_idenvios") REFERENCES "envios"("idenvios") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envios_items" ADD CONSTRAINT "envios_items_productos_idproductos_fkey" FOREIGN KEY ("productos_idproductos") REFERENCES "productos"("idproductos") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_sesiones_caja_idsesiones_caja_fkey" FOREIGN KEY ("sesiones_caja_idsesiones_caja") REFERENCES "sesiones_caja"("idsesiones_caja") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_clientes_idclientes_fkey" FOREIGN KEY ("clientes_idclientes") REFERENCES "clientes"("idclientes") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas_items" ADD CONSTRAINT "facturas_items_facturas_idfacturas_fkey" FOREIGN KEY ("facturas_idfacturas") REFERENCES "facturas"("idfacturas") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_sucursal" ADD CONSTRAINT "inventario_sucursal_sucursales_idsucursales_fkey" FOREIGN KEY ("sucursales_idsucursales") REFERENCES "sucursales"("idsucursales") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_sucursal" ADD CONSTRAINT "inventario_sucursal_productos_idproductos_fkey" FOREIGN KEY ("productos_idproductos") REFERENCES "productos"("idproductos") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_sucursales_idsucursales_fkey" FOREIGN KEY ("sucursales_idsucursales") REFERENCES "sucursales"("idsucursales") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_productos_idproductos_fkey" FOREIGN KEY ("productos_idproductos") REFERENCES "productos"("idproductos") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_usuarios_idusuarios_fkey" FOREIGN KEY ("usuarios_idusuarios") REFERENCES "usuarios"("idusuarios") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_inventario" ADD CONSTRAINT "ordenes_inventario_sucursales_idsucursales_fkey" FOREIGN KEY ("sucursales_idsucursales") REFERENCES "sucursales"("idsucursales") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_inventario" ADD CONSTRAINT "ordenes_inventario_usuarios_idusuarios_creador_fkey" FOREIGN KEY ("usuarios_idusuarios_creador") REFERENCES "usuarios"("idusuarios") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_inventario" ADD CONSTRAINT "ordenes_inventario_usuarios_idusuarios_confirmador_fkey" FOREIGN KEY ("usuarios_idusuarios_confirmador") REFERENCES "usuarios"("idusuarios") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_inventario_items" ADD CONSTRAINT "ordenes_inventario_items_ordenes_inventario_idordenes_inve_fkey" FOREIGN KEY ("ordenes_inventario_idordenes_inventario") REFERENCES "ordenes_inventario"("idordenes_inventario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_inventario_items" ADD CONSTRAINT "ordenes_inventario_items_productos_idproductos_fkey" FOREIGN KEY ("productos_idproductos") REFERENCES "productos"("idproductos") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sacas" ADD CONSTRAINT "sacas_sucursales_idsucursales_fkey" FOREIGN KEY ("sucursales_idsucursales") REFERENCES "sucursales"("idsucursales") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sacas" ADD CONSTRAINT "sacas_sesiones_caja_idsesiones_caja_fkey" FOREIGN KEY ("sesiones_caja_idsesiones_caja") REFERENCES "sesiones_caja"("idsesiones_caja") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sacas" ADD CONSTRAINT "sacas_usuarios_idusuarios_fkey" FOREIGN KEY ("usuarios_idusuarios") REFERENCES "usuarios"("idusuarios") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envios_saca" ADD CONSTRAINT "envios_saca_sacas_idsacas_fkey" FOREIGN KEY ("sacas_idsacas") REFERENCES "sacas"("idsacas") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envios_saca" ADD CONSTRAINT "envios_saca_envios_idenvios_fkey" FOREIGN KEY ("envios_idenvios") REFERENCES "envios"("idenvios") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartados_postales" ADD CONSTRAINT "apartados_postales_sucursales_idsucursales_fkey" FOREIGN KEY ("sucursales_idsucursales") REFERENCES "sucursales"("idsucursales") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartados_postales" ADD CONSTRAINT "apartados_postales_clientes_idclientes_fkey" FOREIGN KEY ("clientes_idclientes") REFERENCES "clientes"("idclientes") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartados_postales" ADD CONSTRAINT "apartados_postales_sesiones_caja_idsesiones_caja_fkey" FOREIGN KEY ("sesiones_caja_idsesiones_caja") REFERENCES "sesiones_caja"("idsesiones_caja") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giros" ADD CONSTRAINT "giros_sucursales_idsucursales_fkey" FOREIGN KEY ("sucursales_idsucursales") REFERENCES "sucursales"("idsucursales") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giros" ADD CONSTRAINT "giros_sucursales_idsucursales_beneficiario_fkey" FOREIGN KEY ("sucursales_idsucursales_beneficiario") REFERENCES "sucursales"("idsucursales") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giros" ADD CONSTRAINT "giros_sesiones_caja_idsesiones_caja_fkey" FOREIGN KEY ("sesiones_caja_idsesiones_caja") REFERENCES "sesiones_caja"("idsesiones_caja") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giros" ADD CONSTRAINT "giros_usuarios_idusuarios_fkey" FOREIGN KEY ("usuarios_idusuarios") REFERENCES "usuarios"("idusuarios") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giros" ADD CONSTRAINT "giros_clientes_idclientes_remitente_fkey" FOREIGN KEY ("clientes_idclientes_remitente") REFERENCES "clientes"("idclientes") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convenios_sucursal" ADD CONSTRAINT "convenios_sucursal_sucursales_idsucursales_fkey" FOREIGN KEY ("sucursales_idsucursales") REFERENCES "sucursales"("idsucursales") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convenios_sucursal" ADD CONSTRAINT "convenios_sucursal_convenios_recaudo_idconvenios_recaudo_fkey" FOREIGN KEY ("convenios_recaudo_idconvenios_recaudo") REFERENCES "convenios_recaudo"("idconvenios_recaudo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recaudos" ADD CONSTRAINT "recaudos_convenios_recaudo_idconvenios_recaudo_fkey" FOREIGN KEY ("convenios_recaudo_idconvenios_recaudo") REFERENCES "convenios_recaudo"("idconvenios_recaudo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recaudos" ADD CONSTRAINT "recaudos_sucursales_idsucursales_fkey" FOREIGN KEY ("sucursales_idsucursales") REFERENCES "sucursales"("idsucursales") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recaudos" ADD CONSTRAINT "recaudos_sesiones_caja_idsesiones_caja_fkey" FOREIGN KEY ("sesiones_caja_idsesiones_caja") REFERENCES "sesiones_caja"("idsesiones_caja") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recaudos" ADD CONSTRAINT "recaudos_usuarios_idusuarios_fkey" FOREIGN KEY ("usuarios_idusuarios") REFERENCES "usuarios"("idusuarios") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recaudos" ADD CONSTRAINT "recaudos_clientes_idclientes_fkey" FOREIGN KEY ("clientes_idclientes") REFERENCES "clientes"("idclientes") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultas_inspektor" ADD CONSTRAINT "consultas_inspektor_giros_idgiros_fkey" FOREIGN KEY ("giros_idgiros") REFERENCES "giros"("idgiros") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultas_inspektor" ADD CONSTRAINT "consultas_inspektor_usuarios_idusuarios_fkey" FOREIGN KEY ("usuarios_idusuarios") REFERENCES "usuarios"("idusuarios") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_sucursales_idsucursales_fkey" FOREIGN KEY ("sucursales_idsucursales") REFERENCES "sucursales"("idsucursales") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_usuarios_idusuarios_creador_fkey" FOREIGN KEY ("usuarios_idusuarios_creador") REFERENCES "usuarios"("idusuarios") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_usuarios_idusuarios_resolutor_fkey" FOREIGN KEY ("usuarios_idusuarios_resolutor") REFERENCES "usuarios"("idusuarios") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anulaciones" ADD CONSTRAINT "anulaciones_usuarios_idusuarios_solicitante_fkey" FOREIGN KEY ("usuarios_idusuarios_solicitante") REFERENCES "usuarios"("idusuarios") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anulaciones" ADD CONSTRAINT "anulaciones_usuarios_idusuarios_aprobador_fkey" FOREIGN KEY ("usuarios_idusuarios_aprobador") REFERENCES "usuarios"("idusuarios") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_auditoria" ADD CONSTRAINT "eventos_auditoria_usuarios_idusuarios_fkey" FOREIGN KEY ("usuarios_idusuarios") REFERENCES "usuarios"("idusuarios") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_auditoria" ADD CONSTRAINT "eventos_auditoria_sucursales_idsucursales_fkey" FOREIGN KEY ("sucursales_idsucursales") REFERENCES "sucursales"("idsucursales") ON DELETE SET NULL ON UPDATE CASCADE;

-- CHECK constraints (no soportadas nativamente por Prisma)
ALTER TABLE "documentos"
  ADD CONSTRAINT "documentos_rango_check" CHECK (desdedocumentos <= hastadocumentos),
  ADD CONSTRAINT "documentos_ultimo_check" CHECK (ultimodocumentos >= 0 AND ultimodocumentos <= hastadocumentos);

ALTER TABLE "clientes"
  ADD CONSTRAINT "clientes_nivel_sisben_check" CHECK (nivel_sisbenclientes BETWEEN 1 AND 4);

ALTER TABLE "ventas_detalle"
  ADD CONSTRAINT "ventas_detalle_cantidad_check" CHECK (cantidadventas_detalle > 0);

ALTER TABLE "envios_items"
  ADD CONSTRAINT "envios_items_cantidad_check" CHECK (cantidadenvios_items > 0);

ALTER TABLE "envios"
  ADD CONSTRAINT "envios_valor_declarado_check" CHECK (valor_declaradoenvios <= 15000000);

-- Índice GIN trigram para búsqueda de clientes por nombre
CREATE INDEX "idx_clientes_nombre" ON "clientes"
  USING gin ((nombreclientes || ' ' || COALESCE(apellidoclientes, '')) gin_trgm_ops);

-- Índice parcial para apartados por vencer
CREATE INDEX "idx_apartados_vencimiento" ON "apartados_postales" ("fecha_finapartados_postales")
  WHERE estadoapartados_postales = 'ocupado';
