"""
Base de conocimiento de muestra con documentos y consulta de prueba.
Contiene políticas corporativas con diferentes grados de ruido y relevancia.
"""

from langchain_core.documents import Document

DEFAULT_QUERY = "¿Cuál es el tiempo de garantía para las laptops asignadas?"


def get_sample_documents() -> list[Document]:
    """Retorna los documentos de prueba para la base de conocimiento."""
    return [
        Document(
            page_content="""[POLÍTICA CORPORATIVA BCP 2026]
Sección 1: Términos y Normativas Internas.
Nota administrativa: Documento registrado bajo revisión legal 884-B en mayo de 2025.
Sección 4.2 - Garantía de Equipos Laptops: Los equipos portátiles asignados al personal cuentan con una garantía extendida oficial de 24 meses a partir de la fecha de entrega y activación en el sistema central.
Sección 4.3 - Excepciones: La garantía no cubre daños por derrame de líquidos o golpes accidentales.
Contacto de soporte técnico de TI: anexo 4500 o soporte_ti@bcp.com.pe. Horario de atención: 8:00 a 18:00 hrs.""",
            metadata={"topic": "laptops", "section": "4.2"}
        ),
        Document(
            page_content="""[GUÍA DE MANTENIMIENTO PREVENTIVO]
Información general sobre desinfección de teclados, soplado de ventiladores y parches del sistema operativo.
El mantenimiento preventivo debe programarse semestralmente con el equipo de TI.
Si el equipo presenta fallas operativas cubiertas por la póliza, refiérase al periodo oficial de garantía de 24 meses estipulado en la sección 4.2.""",
            metadata={"topic": "mantenimiento"}
        ),
        Document(
            page_content="""[CONTRATO MARCO DE ACCESORIOS E INFORMÁTICA]
Cláusula 12: Términos Generales de Adquisición de Periféricos.
Los periféricos menores como mouses, teclados USB y adaptadores de video cuentan únicamente con una garantía estándar de 6 meses.
Para estaciones de trabajo y laptops principales rige la garantía extendida de 24 meses.""",
            metadata={"topic": "perifericos"}
        )
    ]
