-- ============================================================
-- Soy Templo — Datos iniciales de demostración (español)
-- ============================================================

insert into ministries (name, slug, description) values
  ('Jóvenes', 'jovenes', 'Ministerio juvenil de Soy Templo'),
  ('Ministerio Creativo', 'creativo', 'Comunicaciones, música, diseño y producción'),
  ('Niños', 'ninos', 'Ministerio infantil'),
  ('Discipulado', 'discipulado', 'Formación y crecimiento espiritual');

insert into authors (display_name, bio) values
  ('Pastores Soy Templo', 'Equipo pastoral de Soy Templo Internacional');

insert into devotional_categories (name, slug) values
  ('Fe', 'fe'), ('Esperanza', 'esperanza'), ('Oración', 'oracion'), ('Identidad', 'identidad');

-- Devocional del día
insert into devotionals (slug, title, author_id, bible_reading, key_verse, reflection, application, questions, closing_prayer, status, publish_at)
select
  'refugio-en-medio-del-ruido',
  'Refugio en medio del ruido',
  a.id,
  'Salmo 46:1-11',
  'Salmo 46:10 — "Quédense quietos, reconozcan que yo soy Dios."',
  E'Vivimos rodeados de ruido: notificaciones, tráfico, preocupaciones que no se apagan ni de noche. El salmista también conocía el caos —habla de montes que tiemblan y aguas que rugen— y sin embargo abre con una certeza: Dios es nuestro amparo y fortaleza, nuestro pronto auxilio en las tribulaciones.\n\nLa quietud que Dios nos invita a practicar no es pasividad. Es la decisión valiente de soltar el control por un momento para recordar quién sostiene todas las cosas. No se trata de que el ruido desaparezca, sino de que deje de gobernar el corazón.\n\nHoy, antes de responder al día, respóndele a Él.',
  'Aparta cinco minutos hoy, sin teléfono, para estar en silencio delante de Dios. No pidas nada al inicio; solo reconoce que Él es Dios.',
  array[
    '¿Qué "ruidos" están gobernando mi corazón esta semana?',
    '¿Qué me cuesta soltar cuando intento quedarme quieto delante de Dios?',
    '¿En qué situación necesito recordar que Él es mi refugio?'
  ],
  'Padre, en medio del ruido elijo buscarte. Enséñame a estar quieto y a confiar en que Tú peleas por mí. Sé mi refugio hoy. En el nombre de Jesús, amén.',
  'published',
  now()
from authors a limit 1;

-- Plan bíblico de 7 días
insert into bible_plans (slug, name, description, duration_days, level, topic, author_id, status)
select
  'siete-dias-de-quietud',
  'Siete días de quietud',
  'Una semana para aprender a descansar en Dios en medio de una vida acelerada. Cada día incluye una lectura breve, una reflexión y un paso práctico.',
  7, 'beginner', 'Descanso y confianza', a.id, 'published'
from authors a limit 1;

insert into bible_plan_lessons (plan_id, position, title, bible_reading, explanation, questions, activity, prayer)
select p.id, l.position, l.title, l.reading, l.explanation, l.questions, l.activity, l.prayer
from bible_plans p,
(values
  (1, 'El Dios que nos invita a descansar', 'Mateo 11:28-30',
   'Jesús no llama primero a los fuertes, sino a los cansados. Su invitación no es a hacer más, sino a venir a Él. El descanso comienza con una relación, no con unas vacaciones.',
   array['¿De qué estoy cansado realmente?','¿Qué significa para mí "venir" a Jesús hoy?'],
   'Escribe en una nota las tres cargas más pesadas de tu semana y preséntalas a Dios en voz alta.',
   'Señor Jesús, vengo a Ti tal como estoy. Recibo tu descanso. Amén.'),
  (2, 'Quietud no es inactividad', 'Salmo 46:8-11',
   'Estar quietos delante de Dios es un acto de confianza activa: dejamos de intentar controlarlo todo porque sabemos quién está en control.',
   array['¿Qué intento controlar que no me corresponde?'],
   'Hoy, cuando sientas ansiedad, detente diez segundos y repite: "Tú eres Dios, yo no".',
   'Padre, reconozco que Tú eres Dios. Descanso en tu soberanía. Amén.'),
  (3, 'El pastor que hace descansar', 'Salmo 23:1-6',
   'David no dice "el Señor es un pastor", sino "mi pastor". El descanso nace de saber a quién pertenecemos: nada me faltará.',
   array['¿En qué área me cuesta creer que "nada me faltará"?'],
   'Da un paseo corto sin audífonos y agradece a Dios por tres provisiones concretas.',
   'Gracias, Señor, porque eres mi pastor y me guías a aguas de reposo. Amén.'),
  (4, 'Echar la ansiedad, no cargarla', '1 Pedro 5:6-7',
   'Pedro usa un verbo fuerte: echar. La ansiedad no se administra en silencio; se entrega deliberadamente a Aquel que cuida de nosotros.',
   array['¿Qué ansiedad he estado "administrando" en lugar de entregar?'],
   'Escribe tu mayor preocupación en un papel, ora sobre ella y guárdalo como señal de que ya fue entregada.',
   'Padre, echo sobre Ti esta ansiedad. Confío en que cuidas de mí. Amén.'),
  (5, 'La paz que guarda el corazón', 'Filipenses 4:4-9',
   'Pablo escribe sobre la paz desde una cárcel. La gratitud y la oración no cambian primero las circunstancias: cambian primero al que ora.',
   array['¿Por qué puedo dar gracias hoy, incluso en medio de lo difícil?'],
   'Haz una lista de diez motivos de gratitud antes de dormir.',
   'Dios de paz, guarda mi corazón y mis pensamientos en Cristo Jesús. Amén.'),
  (6, 'Descanso en comunidad', 'Hebreos 10:23-25',
   'No fuimos diseñados para sostener la fe en soledad. La comunidad no es un extra: es parte del descanso que Dios nos da.',
   array['¿A quién puedo animar esta semana?','¿De quién necesito dejarme acompañar?'],
   'Envía un mensaje de ánimo a alguien de tu iglesia hoy mismo.',
   'Señor, gracias por mi comunidad. Ayúdame a acompañar y a dejarme acompañar. Amén.'),
  (7, 'Guardar el ritmo', 'Éxodo 20:8-11; Marcos 2:27',
   'El descanso no fue idea nuestra: fue diseño de Dios desde el principio. Guardar un día para Él no es una carga, es un regalo que ordena el resto de la semana.',
   array['¿Cómo puedo construir un ritmo sostenible de descanso y adoración?'],
   'Planifica tu próximo día de descanso: qué harás, qué no harás y con quién lo compartirás.',
   'Padre, gracias por esta semana. Ayúdame a guardar el ritmo que Tú diseñaste para mi vida. Amén.')
) as l(position, title, reading, explanation, questions, activity, prayer)
where p.slug = 'siete-dias-de-quietud';

-- Anuncios
insert into announcements (title, description, category, action_label, action_url, priority, status, publish_at, expires_at) values
  ('Ayuno congregacional de agosto',
   'Del 3 al 7 de agosto nos uniremos como iglesia en cinco días de ayuno y oración por las familias. Cada noche a las 7:00 p. m. tendremos un momento de oración en el templo y en línea.',
   'general', 'Ver horarios', '/eventos', 10, 'published', now(), now() + interval '30 days'),
  ('Convivio de jóvenes: Noche de fogata',
   'Jóvenes, este sábado nos vemos para una noche de fogata, alabanza y testimonios. Trae a un amigo; el pan con ayote corre por cuenta del ministerio.',
   'jovenes', 'Inscribirme', '/eventos', 5, 'published', now(), now() + interval '14 days'),
  ('Se buscan voluntarios para el ministerio creativo',
   'Si tienes habilidades en fotografía, video, diseño o redes sociales, el equipo de comunicaciones quiere conocerte. Escríbenos o acércate al final del servicio.',
   'creativo', 'Quiero servir', '/oracion', 3, 'published', now(), now() + interval '60 days');

-- Eventos
insert into events (slug, name, description, starts_at, ends_at, location, ministry_id, requires_registration, status)
values
  ('noche-de-adoracion-julio',
   'Noche de adoración',
   'Una noche para buscar a Dios juntos con música, oración y Palabra. Entrada libre.',
   now() + interval '5 days' + interval '19 hours' - interval '12 hours',
   now() + interval '5 days' + interval '21 hours' - interval '12 hours',
   'Templo central, San Salvador', null, false, 'published'),
  ('fogata-jovenes',
   'Noche de fogata — Jóvenes',
   'Convivio juvenil con fogata, alabanza acústica y testimonios.',
   now() + interval '9 days', now() + interval '9 days' + interval '3 hours',
   'Explanada del templo', (select id from ministries where slug = 'jovenes'), true, 'published'),
  ('taller-creativo',
   'Taller del ministerio creativo',
   'Capacitación para voluntarios de comunicaciones: fotografía, redes y producción de servicios.',
   now() + interval '16 days', now() + interval '16 days' + interval '4 hours',
   'Salón 2, Soy Templo', (select id from ministries where slug = 'creativo'), true, 'published');

-- Categorías de donación
insert into donation_categories (name, slug, description) values
  ('Diezmos', 'diezmos', 'Fidelidad y gratitud a Dios con las primicias'),
  ('Ofrendas', 'ofrendas', 'Ofrenda voluntaria para la obra'),
  ('Misiones', 'misiones', 'Apoyo a misioneros y proyectos de alcance'),
  ('Ayuda social', 'ayuda-social', 'Canastas, emergencias y servicio comunitario'),
  ('Construcción', 'construccion', 'Mejoras y ampliación del templo'),
  ('Ministerio infantil', 'ministerio-infantil', 'Materiales y actividades para los niños'),
  ('Ministerio creativo', 'ministerio-creativo', 'Equipo y producción para comunicaciones'),
  ('Donación general', 'general', 'Donde más se necesite');

-- Petición de oración de ejemplo (pública y aprobada)
insert into prayer_requests (body, category, is_public, is_anonymous, status)
values (
  'Pido oración por la salud de mi mamá, que enfrenta una cirugía la próxima semana. Creemos que Dios tiene el control, pero agradecemos que nos acompañen en fe.',
  'salud', true, true, 'approved');

-- Información de la iglesia
insert into app_settings (key, value) values
  ('church_info', '{
    "name": "Soy Templo Internacional",
    "tagline": "Una casa para encontrarte con Dios",
    "address": "San Salvador, El Salvador",
    "email": "hola@soytemplo.org",
    "service_times": "Domingos 9:00 a. m. y 11:00 a. m.",
    "social": {
      "youtube": "https://youtube.com/@soytemplo",
      "facebook": "https://facebook.com/soytemplo",
      "instagram": "https://instagram.com/soytemplo",
      "tiktok": "https://tiktok.com/@soytemplo"
    },
    "stream_url": null
  }'::jsonb),
  ('theme', '{
    "primary": "#27357E",
    "secondary": "#3E6B4F",
    "accent": "#C98A2D"
  }'::jsonb);
