## Productividad del agente con Caveman y Graphify

El agente debe usar herramientas de productividad para trabajar mas rapido, con menos ruido y mejor comprension del sistema.

### Caveman

Usar Caveman para reducir respuestas largas innecesarias.

Reglas:

- Responder corto cuando el cambio sea simple.
- Evitar explicaciones largas si el usuario pidio codigo o solucion directa.
- Priorizar claridad sobre cantidad de texto.
- No eliminar informacion importante.
- No resumir logica critica de negocio.
- Usar respuestas extensas solo cuando:
  - se modifica arquitectura
  - se toca base de datos
  - se cambia logica de stock
  - se afecta liquidaciones
  - hay riesgo de romper el sistema

Objetivo:

> Menos palabras, mas accion.

Caveman ayuda a reducir tokens de salida, pero no reemplaza el razonamiento del agente. Su funcion es hacer que el agente sea mas directo y eficiente.

### Graphify

Usar Graphify para entender el proyecto por estructura, no solo buscando archivos sueltos.

Antes de hacer cambios grandes, el agente debe revisar:

```bash
graphify-out/GRAPH_REPORT.md
```

Si el grafo existe, usarlo antes de buscar en archivos crudos para preguntas de arquitectura, relaciones entre modulos o flujos importantes.

Comandos utiles:

```bash
graphify query "<pregunta>"
graphify path "<A>" "<B>"
graphify explain "<concepto>"
graphify update .
```

Despues de modificar codigo, actualizar el grafo con `graphify update .` cuando exista `graphify-out/graph.json`.
