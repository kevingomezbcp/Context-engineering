Sí, está relacionado con que un LLM predice tokens, pero la relación importante no es simplemente:

[
\text{más contexto} \Rightarrow \text{mejor respuesta}
]

La relación correcta es:

[
\text{más información relevante y utilizable}
\Rightarrow
\text{mejor predicción de los tokens de salida}
]

## 1. Un LLM genera una respuesta como una distribución condicional

Dada una consulta (X), un contexto adicional (C) y los tokens ya generados (y_{<t}), el modelo calcula:

[
P_\theta(y_t \mid X,C,y_{<t})
]

La probabilidad de toda la respuesta (Y=(y_1,\ldots,y_T)) es:

[
P_\theta(Y\mid X,C)
===================

\prod_{t=1}^{T}
P_\theta(y_t\mid X,C,y_{<t})
]

Por tanto, el contexto mejora la respuesta cuando modifica estas distribuciones de probabilidad en una dirección correcta. Es decir, cuando hace más probable el token adecuado y menos probables las alternativas incorrectas.

Por ejemplo:

* Sin contexto: «La garantía dura probablemente 12 meses».
* Con el contrato: «La garantía dura 24 meses».

El contexto cambia:

[
P(\text{“24”}\mid X,C)

>

P(\text{“12”}\mid X,C)
]

## 2. La relación teórica puede expresarse mediante entropía

Sea (Y) la respuesta correcta. Sin contexto adicional, la incertidumbre es:

[
H(Y\mid X)
]

Al añadir contexto (C):

[
H(Y\mid X,C)
]

En teoría de la información se cumple:

[
H(Y\mid X,C)\leq H(Y\mid X)
]

Es decir, **disponer de más variables nunca aumenta la incertidumbre para un predictor ideal**. La reducción es exactamente la información mutua condicional:

[
I(Y;C\mid X)
============

H(Y\mid X)-H(Y\mid X,C)
]

Esto proporciona una interpretación matemática útil:

[
\text{beneficio potencial del contexto}
\approx
I(Y;C\mid X)
]

Si el contexto contiene información altamente relacionada con la respuesta, (I(Y;C\mid X)) será alta. Si el contexto es irrelevante, repetitivo o desconectado de la pregunta:

[
I(Y;C\mid X)\approx 0
]

y agregarlo casi no aporta nada.

## 3. Pero un LLM real no es un predictor ideal

Aunque teóricamente más información no debería perjudicar, en modelos reales sí puede hacerlo. El modelo implementa una aproximación:

[
P_\theta(Y\mid X,C)
\neq
P^*(Y\mid X,C)
]

donde (P^*) sería la distribución ideal.

La calidad observada puede representarse aproximadamente como:

[
Q(C)
====

## \underbrace{R(C)}_{\text{información relevante}}

## \underbrace{N(C)}_{\text{ruido}}

## \underbrace{D(C)}_{\text{dificultad de localizarla}}

\underbrace{K(C)}_{\text{conflictos}}
]

Donde:

* (R(C)): evidencia útil para responder.
* (N(C)): información irrelevante.
* (D(C)): dificultad para encontrar la evidencia dentro del contexto.
* (K(C)): contradicciones o instrucciones conflictivas.

Por eso la calidad como función de la longitud (n) del contexto no suele ser monotónica:

[
Q(n+1)\not\geq Q(n)
]

Una forma conceptual más realista sería:

[
Q(n)
\approx
Q_0
+
\alpha,I_{\text{relevante}}(n)
------------------------------

## \beta,N(n)

\gamma,D(n)
]

El contexto mejora la calidad mientras el aumento de información relevante sea mayor que el aumento de ruido y dificultad.

## 4. Cantidad de tokens no equivale a cantidad de información

Dos contextos de 10 000 tokens pueden tener valores completamente diferentes:

[
|C_1|=|C_2|=10,000
]

pero:

[
I(Y;C_1\mid X)\gg I(Y;C_2\mid X)
]

Por ejemplo:

* (C_1): contiene la cláusula exacta que responde la pregunta.
* (C_2): contiene páginas relacionadas con el tema, pero no la respuesta.

Así, la variable relevante no es únicamente:

[
n=\text{número de tokens}
]

sino algo más parecido a:

[
S(C,X)
======

\frac{\text{información relevante para }X}
{\text{información total del contexto}}
]

Esto puede entenderse como una **densidad de señal**. Un contexto corto y preciso suele ser mejor que uno largo y ruidoso.

## 5. ¿Por qué el ruido afecta si el modelo “solo predice tokens”?

Precisamente porque cada token de salida se predice usando representaciones construidas a partir de todos los tokens disponibles.

En un Transformer, cada token genera consultas, claves y valores:

[
Q=XW_Q,\qquad K=XW_K,\qquad V=XW_V
]

Y la atención se calcula como:

[
\operatorname{Attention}(Q,K,V)
===============================

\operatorname{softmax}
\left(
\frac{QK^\top}{\sqrt{d_k}}
\right)V
]

Al aumentar la cantidad de contexto, aumenta el número de tokens entre los que el modelo debe distribuir su atención.

No significa que la atención se divida uniformemente, pero sí que el modelo debe resolver una tarea más difícil:

[
\text{identificar evidencia relevante}
\longrightarrow
\text{integrarla}
\longrightarrow
\text{generar la respuesta}
]

Si existe un único fragmento relevante entre cientos de fragmentos similares, puede asignar más peso a un distractor que al fragmento correcto.

## 6. El contexto afecta dos tareas diferentes

Es útil separar:

### Recuperación dentro del contexto

El modelo debe localizar qué tokens son relevantes:

[
C^*=\operatorname{RetrieveInternally}(X,C)
]

### Generación

Después debe producir la respuesta:

[
Y\sim P_\theta(Y\mid X,C^*)
]

Muchos errores atribuidos a la “generación” son realmente errores de recuperación interna. La respuesta estaba en el prompt, pero el modelo no la identificó, la confundió o no le asignó suficiente peso.

Esto es particularmente importante en RAG. El desempeño completo puede aproximarse como:

[
P(\text{respuesta correcta})
\approx
P(\text{recuperar evidencia correcta})
\cdot
P(\text{responder correctamente}\mid\text{evidencia})
]

Por ejemplo:

[
0.8\times0.9=0.72
]

Aunque el modelo responda correctamente el 90 % de las veces cuando recibe la evidencia adecuada, el sistema completo solo alcanzará un 72 % si la recuperación falla en el 20 % de los casos.

## 7. Relación con la función de pérdida

Durante entrenamiento, el LLM minimiza normalmente la entropía cruzada:

[
\mathcal{L}
===========

-\sum_{t=1}^{T}
\log P_\theta(y_t^*\mid X,C,y_{<t}^*)
]

Si el contexto permite asignar mayor probabilidad al token correcto (y_t^*), la pérdida disminuye:

[
P_\theta(y_t^*\mid X,C_2)

>

P_\theta(y_t^*\mid X,C_1)
\Rightarrow
\mathcal{L}(C_2)<\mathcal{L}(C_1)
]

Pero esto solo ocurre si el modelo sabe usar (C_2). Un contexto más largo puede contener la respuesta y aun así producir mayor pérdida debido a distractores o a una representación deficiente de la información.

## 8. Conclusión práctica

No existe una ley universal del tipo:

[
Q = a\log(n)
]

o:

[
Q\propto n
]

La relación depende de:

[
Q
=

f(
\text{relevancia},
\text{posición},
\text{redundancia},
\text{contradicciones},
\text{estructura},
\text{capacidad del modelo},
\text{pregunta}
)
]

En términos simples:

[
\boxed{
\text{La calidad mejora cuando el contexto reduce la incertidumbre sobre los próximos tokens correctos}
}
]

Pero:

[
\boxed{
\text{aumentar tokens no garantiza reducir esa incertidumbre en un LLM real}
}
]

Por eso, en sistemas productivos, el objetivo no debería ser maximizar la cantidad de contexto, sino maximizar algo parecido a:

[
\frac{I(Y;C\mid X)}
{\text{tokens utilizados}}
]

Es decir, **la información útil por token**. Esta es una buena manera matemática de entender por qué el filtrado, reranking, compresión de contexto y selección de chunks suelen mejorar un sistema RAG más que simplemente aumentar el número de chunks.

Cuando la consulta (X) es ambigua, el problema matemático cambia porque (X) ya no determina con suficiente precisión qué respuesta (Y) busca el usuario.

La forma más útil de modelarlo es introducir una variable latente:

[
Z=\text{intención real del usuario}
]

Entonces la generación correcta no depende solo de (X), sino de:

[
P(Y\mid X,C)
============

\sum_z P(Y\mid X,C,Z=z),P(Z=z\mid X,C)
]

Es decir, el modelo debe hacer dos cosas:

1. inferir qué quiso decir el usuario;
2. responder según esa interpretación.

La ambigüedad afecta principalmente al primer paso.

---

## 1. La distribución de respuestas se vuelve multimodal

Supongamos que alguien pregunta:

> “¿Cómo funciona la memoria del agente?”

Esto podría referirse a:

* memoria conversacional;
* memoria persistente;
* memoria de trabajo;
* ventana de contexto;
* memoria de un framework específico.

Si representamos esas interpretaciones como (Z_1,\dots,Z_k), entonces:

[
P(Y\mid X,C)
============

\sum_{i=1}^{k}
P(Y\mid X,C,Z_i),P(Z_i\mid X,C)
]

Cuando una interpretación domina:

[
P(Z_1\mid X,C)\approx 1
]

la respuesta es relativamente estable.

Cuando varias interpretaciones son plausibles:

[
P(Z_1\mid X,C)\approx 0.4,\qquad
P(Z_2\mid X,C)\approx 0.35,\qquad
P(Z_3\mid X,C)\approx 0.25
]

la distribución de respuestas tiene varios modos plausibles. El modelo puede producir una respuesta coherente, pero responder a la interpretación equivocada.

---

## 2. Aumenta la entropía de la intención

La incertidumbre sobre lo que el usuario quiso decir puede expresarse como:

[
H(Z\mid X)
]

Si la consulta es clara:

[
H(Z\mid X)\approx 0
]

Si es ambigua:

[
H(Z\mid X)\gg 0
]

Esta incertidumbre sobre (Z) se transmite a la respuesta:

[
H(Y\mid X)
]

Una consulta ambigua suele aumentar (H(Y\mid X)), porque existen varias respuestas potencialmente válidas según la interpretación.

De forma intuitiva:

[
\text{ambigüedad de }X
\Rightarrow
\text{incertidumbre sobre }Z
\Rightarrow
\text{incertidumbre sobre }Y
]

---

## 3. El contexto puede reducir la ambigüedad, pero no siempre

Anteriormente expresamos el beneficio del contexto como:

[
I(Y;C\mid X)
]

Pero cuando existe una intención latente (Z), parte importante del contexto sirve primero para identificar esa intención:

[
I(Z;C\mid X)
]

Por tanto, el contexto puede ayudar de dos maneras:

[
\text{beneficio de }C
=====================

\underbrace{I(Z;C\mid X)}*{\text{desambiguar intención}}
+
\underbrace{I(Y;C\mid X,Z)}*{\text{responder una vez conocida la intención}}
]

Esta descomposición es conceptualmente importante.

Un fragmento de contexto puede no contener directamente la respuesta, pero sí indicar qué interpretación es correcta.

Por ejemplo:

* Consulta: “¿Cómo funciona la memoria?”
* Contexto previo: “Estamos analizando Strands Agents.”

Ese contexto reduce:

[
H(Z\mid X,C)
]

porque ahora “memoria” probablemente se refiere al mecanismo de memoria de Strands.

---

## 4. La ambigüedad modifica qué contexto es relevante

Cuando (X) es clara, podemos evaluar la relevancia de un documento (C_i) mediante algo como:

[
\operatorname{Rel}(C_i,X)
]

Pero si (X) es ambigua, la relevancia depende de la interpretación:

[
\operatorname{Rel}(C_i,X,Z)
]

Un mismo chunk puede ser:

[
\operatorname{Rel}(C_i,X,Z_1)\approx 1
]

pero:

[
\operatorname{Rel}(C_i,X,Z_2)\approx 0
]

Esto genera un problema para un sistema RAG: el retriever debe seleccionar documentos antes de conocer con certeza la intención.

La recuperación efectiva se convierte en:

[
P(C_i\text{ relevante}\mid X)
=============================

\sum_z
P(C_i\text{ relevante}\mid X,Z=z)
P(Z=z\mid X)
]

Si varias intenciones son plausibles, el sistema puede recuperar chunks de varias interpretaciones distintas. El resultado es un contexto heterogéneo y potencialmente contradictorio.

---

## 5. Impacto sobre embeddings y recuperación semántica

Un embedding de la consulta puede representarse como:

[
e_X=f_\theta(X)
]

Pero una consulta ambigua contiene varios significados posibles. El embedding termina siendo una representación agregada o comprometida entre ellos.

Conceptualmente:

[
e_X
\approx
\sum_z P(Z=z\mid X)e_{X,z}
]

donde (e_{X,z}) sería la representación de la consulta bajo una interpretación concreta.

Esto puede colocar al vector de la consulta entre varios clústeres semánticos, sin quedar suficientemente cerca de ninguno.

Ejemplo conceptual:

[
e_X=0.5e_{\text{memoria conversacional}}
+
0.5e_{\text{memoria informática}}
]

La similitud con cada documento puede ser moderada, pero no máxima:

[
\cos(e_X,e_{C_1})=0.65
]

[
\cos(e_X,e_{C_2})=0.63
]

El retriever puede devolver resultados de ambos sentidos.

Por eso las consultas ambiguas suelen reducir el margen entre candidatos relevantes e irrelevantes:

[
\Delta
======

## s(C_{\text{correcto}},X)

s(C_{\text{incorrecto}},X)
]

Con consultas claras:

[
\Delta \gg 0
]

Con consultas ambiguas:

[
\Delta \approx 0
]

Esto vuelve inestable el ranking.

---

## 6. La ambigüedad deteriora el reranking

Un reranker normalmente estima:

[
s_i=P(C_i\text{ relevante}\mid X)
]

Pero si la consulta admite varias intenciones:

[
s_i
===

\sum_z
P(C_i\text{ relevante}\mid X,Z=z)
P(Z=z\mid X)
]

Un chunk puede recibir una puntuación alta porque responde bien a una interpretación minoritaria, aunque no sea la que el usuario pretendía.

Ejemplo:

[
P(Z_1\mid X)=0.55
]

[
P(Z_2\mid X)=0.45
]

Chunk (C_1), relevante para (Z_1):

[
P(C_1\text{ rel.}\mid X,Z_1)=0.9
]

[
P(C_1\text{ rel.}\mid X,Z_2)=0.1
]

Entonces:

[
P(C_1\text{ rel.}\mid X)
========================

# 0.55(0.9)+0.45(0.1)

0.54
]

Chunk (C_2), relevante para (Z_2):

[
P(C_2\text{ rel.}\mid X,Z_1)=0.2
]

[
P(C_2\text{ rel.}\mid X,Z_2)=0.95
]

[
P(C_2\text{ rel.}\mid X)
========================

# 0.55(0.2)+0.45(0.95)

0.5375
]

Los dos chunks quedan casi empatados:

[
0.54\approx0.5375
]

El reranker no tiene suficiente señal para distinguirlos.

---

## 7. Incluso con contexto correcto puede persistir la ambigüedad

Supongamos que el sistema recupera documentos para todas las interpretaciones posibles. Entonces el contexto puede contener:

[
C=C_{Z_1}\cup C_{Z_2}
]

Ahora el modelo ve información válida, pero incompatible con una única respuesta.

La distribución final permanece mezclada:

[
P(Y\mid X,C)
============

P(Y\mid X,C,Z_1)P(Z_1\mid X,C)
+
P(Y\mid X,C,Z_2)P(Z_2\mid X,C)
]

El modelo puede:

* escoger arbitrariamente una interpretación;
* mezclar ambas;
* producir una respuesta genérica;
* dar una respuesta larga cubriendo varios sentidos;
* formular una aclaración.

En términos probabilísticos, la calidad puede disminuir aunque todos los documentos sean correctos, porque no está resuelto qué subconjunto del contexto debe condicionar la respuesta.

---

## 8. Aparece un error irreducible

Si dos intenciones distintas generan exactamente la misma consulta observable (X), ningún modelo puede distinguirlas únicamente a partir de esa consulta.

Supongamos:

[
P(Z_1\mid X)=0.6
]

[
P(Z_2\mid X)=0.4
]

Incluso un clasificador Bayesiano perfecto escogería (Z_1), pero fallaría cuando la intención real fuera (Z_2).

El error mínimo posible sería:

[
R^*
===

1-\max_z P(Z=z\mid X)
]

En este ejemplo:

[
R^*=1-0.6=0.4
]

Es decir, existe un error Bayesiano mínimo del 40 % si no se obtiene información adicional.

Esto es importante: no toda respuesta incorrecta ante una pregunta ambigua es un fallo de capacidad del LLM. Puede ser un problema de no identificabilidad.

[
X\not\Rightarrow Z
]

La consulta no contiene suficiente información para recuperar de forma única la intención.

---

## 9. La aclaración es una operación de reducción de entropía

Una pregunta aclaratoria introduce una nueva variable (A):

[
A=\text{respuesta del usuario a la aclaración}
]

Después de recibirla, la incertidumbre pasa de:

[
H(Z\mid X)
]

a:

[
H(Z\mid X,A)
]

La información obtenida por la aclaración es:

[
I(Z;A\mid X)
============

H(Z\mid X)-H(Z\mid X,A)
]

La aclaración ideal es la que maximiza esa reducción:

[
A^*
===

\arg\max_A I(Z;A\mid X)
]

Por ejemplo, ante:

> “¿Cómo funciona la memoria?”

Una buena aclaración sería:

> “¿Te refieres a la ventana de contexto del LLM o a la memoria persistente del agente?”

Esa pregunta separa directamente las dos hipótesis principales.

Esto se parece a active learning o optimal experiment design: el sistema formula la pregunta que más reduce la incertidumbre.

---

## 10. Cuándo debería responder y cuándo aclarar

El modelo puede comparar el coste esperado de responder directamente con el coste de pedir aclaración.

Sea:

* (L(\hat Y,Y)): pérdida por dar una respuesta incorrecta;
* (c_A): coste de hacer una pregunta adicional.

Responder directamente tendría una pérdida esperada:

[
R_{\text{directo}}
==================

\min_{\hat Y}
\mathbb{E}[L(\hat Y,Y)\mid X,C]
]

Preguntar primero tendría:

[
R_{\text{aclarar}}
==================

c_A
+
\mathbb{E}*A
\left[
\min*{\hat Y}
\mathbb{E}[L(\hat Y,Y)\mid X,C,A]
\right]
]

Conviene aclarar cuando:

[
R_{\text{aclarar}}
<
R_{\text{directo}}
]

En tareas de bajo riesgo, el modelo puede asumir la interpretación más probable.

En tareas médicas, legales, financieras o de ejecución irreversible, el coste de equivocarse es mayor, por lo que pedir aclaración es más razonable.

---

## 11. Impacto sobre la predicción token por token

Sí, todo esto sigue manifestándose como predicción de tokens.

El modelo predice:

[
P(y_t\mid X,C,y_{<t})
]

Pero cuando (X) es ambigua, esa distribución es una mezcla de predicciones asociadas a distintas intenciones:

[
P(y_t\mid X,C,y_{<t})
=====================

\sum_z
P(y_t\mid X,C,y_{<t},Z=z)
P(Z=z\mid X,C,y_{<t})
]

Por ejemplo, si el usuario pregunta:

> “¿Cuál es el banco más grande?”

“Más grande” puede significar:

* activos;
* capitalización bursátil;
* número de clientes;
* ingresos;
* presencia geográfica.

Los primeros tokens de la respuesta pueden competir:

[
P(\text{“Por activos”}\mid X)
]

[
P(\text{“Por capitalización”}\mid X)
]

[
P(\text{“Depende del criterio”}\mid X)
]

La ambigüedad no impide que el modelo prediga tokens. Hace que existan varias secuencias de tokens plausibles con probabilidades parecidas.

---

## 12. La generación temprana puede fijar una interpretación accidental

Como la generación es autorregresiva:

[
P(Y\mid X,C)
============

\prod_t P(y_t\mid X,C,y_{<t})
]

los primeros tokens pueden comprometer al modelo con una interpretación específica.

Supongamos que el modelo comienza con:

> “En términos de capitalización bursátil…”

A partir de ese momento, los tokens previos (y_{<t}) refuerzan esa interpretación:

[
P(Z=\text{capitalización}\mid X,C,y_{<t})
\rightarrow 1
]

Aunque inicialmente hubiera incertidumbre, el propio texto generado crea un proceso de auto-condicionamiento.

Esto puede verse como una reducción artificial de la entropía:

[
H(Z\mid X,C,y_{<t})
<
H(Z\mid X,C)
]

Pero esa reducción no proviene de nueva evidencia del usuario, sino de una decisión temprana del modelo. Por eso puede aparecer una respuesta segura pero basada en una interpretación arbitraria.

---

## 13. Relación matemática completa del pipeline

Para un sistema RAG, el proceso puede representarse así:

[
X
\rightarrow
\hat Z
\rightarrow
C_R
\rightarrow
Y
]

donde:

* (X): consulta ambigua;
* (\hat Z): intención estimada;
* (C_R): contexto recuperado;
* (Y): respuesta.

La probabilidad de éxito puede aproximarse como:

[
P(Y\text{ correcta}\mid X)
==========================

\sum_z
P(Z=z\mid X)
P(C_R\text{ correcto}\mid X,z)
P(Y\text{ correcta}\mid X,C_R,z)
]

La ambigüedad deteriora todo el pipeline porque afecta:

[
P(Z=z\mid X)
]

Luego afecta la recuperación:

[
P(C_R\text{ correcto}\mid X,z)
]

y finalmente la generación:

[
P(Y\text{ correcta}\mid X,C_R,z)
]

Por tanto, el error total no es solo generativo. Puede descomponerse en:

[
\text{error total}
==================

\text{error de interpretación}
+
\text{error de recuperación}
+
\text{error de generación}
]

aunque no sean estrictamente independientes.

---

## 14. Ejemplo numérico

Supongamos una consulta con dos intenciones:

[
P(Z_1\mid X)=0.7
]

[
P(Z_2\mid X)=0.3
]

El retriever tiene estas probabilidades de recuperar el chunk correcto:

[
P(C^*\mid X,Z_1)=0.9
]

[
P(C^*\mid X,Z_2)=0.5
]

Y el LLM, dado el contexto correcto, responde bien con probabilidad:

[
P(Y^*\mid C^*,Z)=0.95
]

Entonces:

[
P(Y^*\mid X)
============

0.7(0.9)(0.95)
+
0.3(0.5)(0.95)
]

[
P(Y^*\mid X)
============

0.5985+0.1425=0.741
]

La probabilidad total de éxito es 74.1 %.

Si una aclaración permite identificar perfectamente (Z), y después el retriever alcanza 90 % para ambas intenciones:

[
P(Y^*\mid X,A)
==============

# 0.9(0.95)

0.855
]

La mejora sería:

[
0.855-0.741=0.114
]

es decir, 11.4 puntos porcentuales.

---

## 15. Métrica práctica de ambigüedad

Una medida básica sería la entropía de las posibles intenciones:

[
A(X)=H(Z\mid X)
===============

-\sum_z P(Z=z\mid X)\log P(Z=z\mid X)
]

También puede usarse el margen entre las dos interpretaciones más probables:

[
M(X)=P(Z_{(1)}\mid X)-P(Z_{(2)}\mid X)
]

* Margen alto: consulta poco ambigua.
* Margen bajo: consulta ambigua.

Otra medida es:

[
A_{\text{margin}}(X)=1-M(X)
]

También puede medirse la estabilidad de recuperación reformulando la consulta varias veces. Si pequeñas paráfrasis producen conjuntos de chunks muy distintos, probablemente la consulta sea semánticamente inestable.

[
\operatorname{Stability}(X)
===========================

\frac{1}{m(m-1)}
\sum_{i\neq j}
\operatorname{Jaccard}(R(X_i),R(X_j))
]

Baja estabilidad puede indicar ambigüedad o sensibilidad excesiva del retriever.

---

## Conclusión

La consulta ambigua introduce una variable latente de intención:

[
Z
]

y convierte la generación en una distribución mezclada:

[
\boxed{
P(Y\mid X,C)
============

\sum_z P(Y\mid X,C,Z=z)P(Z=z\mid X,C)
}
]

Su efecto principal es:

[
\boxed{
H(Z\mid X)\uparrow
\Rightarrow
H(Y\mid X,C)\uparrow
}
]

Además, perjudica recuperación, reranking y generación porque la relevancia del contexto depende de una intención todavía no resuelta.

Por eso, en un sistema productivo, no basta con aumentar el contexto. Primero debe determinarse si el contexto reduce:

[
H(Z\mid X,C)
]

Si no lo reduce, puede terminar aportando evidencia para varias interpretaciones y aumentar la confusión. La pregunta aclaratoria funciona precisamente como un mecanismo para maximizar:

[
I(Z;A\mid X)
]

es decir, la información obtenida sobre la verdadera intención del usuario.
