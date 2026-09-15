import { z } from 'zod';

const PersonaGiroSchema = z.object({
  tipoDoc:      z.string().min(1).optional(),
  numeroDoc:    z.string().min(1).max(30),
  nombre:       z.string().min(1),
  fechaExpDoc:  z.string().optional(),
  ciudad:       z.string().optional(),
  direccion:    z.string().optional(),
  email:        z.string().email().optional(),
  telefono:     z.string().optional(),
  mensaje:      z.string().optional(),
  huella:       z.boolean().optional(),
  pep:          z.boolean().optional(),
  sospechoso:   z.boolean().optional(),
});

const BeneficiarioIntlSchema = PersonaGiroSchema.extend({
  fechaNac:     z.string().optional(),
  pais:         z.string().min(2).max(3).optional(),
  estado:       z.string().optional(),
});

export const EmitirGiroNacionalSchema = z.object({
  montoCop:    z.number().positive(),
  remitente:   PersonaGiroSchema.optional(),
  beneficiario: PersonaGiroSchema,
});

export const PagarGiroNacionalSchema = z.object({
  pin:                   z.string().length(6),
  nombreBeneficiario:    z.string().min(1),
  numeroDocBeneficiario: z.string().min(1),
});

export const EmitirGiroInternacionalSchema = z.object({
  montoCop:          z.number().positive(),
  trmDia:            z.number().positive(),
  operador:          z.enum(['moneygram', 'ria', 'ifs']).optional(),
  monedaDestino:     z.string().optional(),
  pin:               z.string().optional(),
  numeroReferencia:  z.string().optional(),
  remitente:         PersonaGiroSchema.optional(),
  beneficiario:      BeneficiarioIntlSchema,
});

export const PagarGiroInternacionalSchema = z.object({
  pin:                    z.string().min(6),
  nombreBeneficiario:     z.string().min(1),
  numeroDocBeneficiario:  z.string().min(1),
  fechaNacBeneficiario:   z.string(),
});

export type EmitirGiroNacionalDto    = z.infer<typeof EmitirGiroNacionalSchema>;
export type PagarGiroNacionalDto     = z.infer<typeof PagarGiroNacionalSchema>;
export type EmitirGiroInternacionalDto = z.infer<typeof EmitirGiroInternacionalSchema>;
export type PagarGiroInternacionalDto  = z.infer<typeof PagarGiroInternacionalSchema>;
