# Ejercicio 5

## Introducción

La disponibilidad de un servicio es una medida del porcentaje de tiempo que está funcionando y accesible a los usuarios. Todos los servicios son vulnerables ante problemas de infraestructura, un servidor puede caerse, el disco duro llenarse, etc. Y todos estos problemas impactan directamente en la disponibilidad de nuestro servicio.

Queremos garantizar la disponibilidad de servicio ante fallos en la base de datos. Para ello vamos a crear una nueva instancia de la base de datos, e implementar diferentes modelos de replicación entre los dos nodos.

### 1 - Crear una base de datos de réplica.

- Define una nueva instancia de Mongo. Usaremos esta base de datos como réplica de la principal, pero vamos a implementar los modelos de replicación nosotros mismos.

### 2 - Replicación de la base de datos.

La naturaleza de nuestros datos hace que su modelo de replicación no tenga que ser el mismo necesariamente:

- La base de datos de crédito es crítica, no podemos basarnos en información desactualizada a la hora de realizar pagos. Implementa un modelo de replicación que nos garantice una consistencia muy fuerte en los datos. Esto significa que los contenidos de la base principal y los de la réplica deben estar alineados en todo momento. ¿Qué modificaciones son necesarias en las operaciones de escritura?
- El registro de mensajes no exige una consistencia tan fuerte. Implementa un modelo que sea eventualmente consistente. Este modelo no es tan estricto como el anterior. ¿Cómo se ejecutarán las operaciones de escritura?

### 3 - ¿Son fiables nuestros modelos de replicación?

Una vez implementados nuestro modelos de replicación, tenemos que garantizar que funcionan correctamente:

- ¿Nuestro servicio sigue disponible si el nodo principal de la BBDD deja de funcionar? Para el nodo y compruébalo.
- ¿Los datos en el nodo secundario son consistentes con los del principal? Es importante comprobar que los datos de crédito son consistentes, no podemos utilizar información antigua para pagar nuevos envíos.
- Cuando el nodo principal vuelva a ser funcional se encontrará desactualizado. En este escenario, el nodo secundario pasará a ser el principal, y el nuevo secundario necesitará actualizar su contenido (el servicio siguió funcionando en su ausencia).
- Piensa en este y otros escenarios de indisponibilidad de nodos en la BBDD.
