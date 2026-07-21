-- AlterEnum: agregar 'cheque' como medio de pago
ALTER TYPE "medio_pago" ADD VALUE 'cheque';

-- AlterEnum: agregar 'giro' y 'paquete' como tipos de producto
ALTER TYPE "tipo_producto" ADD VALUE 'giro';
ALTER TYPE "tipo_producto" ADD VALUE 'paquete';
