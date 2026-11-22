-- Servicios iniciales del catálogo (los mismos del sitio).
-- ON CONFLICT evita duplicarlos si se vuelve a ejecutar.
INSERT INTO servicios (codigo, categoria, nombre, especie, duracion, precio, descuento, stock, stock_critico, observaciones, descripcion, imagen) VALUES
  ('SV001', 'Consultas', 'Consulta general', 'Perro / Gato', '30 min', 15000, 0, 20, 5, '', 'Revisión general del estado de salud de tu mascota, con orientación sobre cuidados y controles preventivos.', '/img/consulta-general.jpg'),
  ('SV002', 'Consultas', 'Consulta urgencia', 'Perro / Gato', '30 min', 25000, 0, 4, 3, 'Fuera de horario +$10.000', 'Atención prioritaria para casos que no pueden esperar una hora agendada. Fuera del horario normal se aplica un recargo.', '/img/consulta-general.jpg'),
  ('VA001', 'Vacunación', 'Vacuna antirrábica canina', 'Perro', '10 min', 12000, 0, 15, 4, 'Obligatoria por ley', 'Vacuna obligatoria por ley que protege a tu perro contra la rabia. Aplicación rápida, sin necesidad de ayuno previo.', '/img/vacuna-antirrabica.jpg'),
  ('VA002', 'Vacunación', 'Vacuna séxtuple canina', 'Perro', '10 min', 18000, 15, 12, 4, 'Refuerzo anual', 'Vacuna polivalente que protege a tu perro frente a seis enfermedades virales y bacterianas frecuentes.', '/img/vacuna-antirrabica.jpg'),
  ('VA003', 'Vacunación', 'Vacuna bivalente felina', 'Gato', '10 min', 15000, 0, 3, 4, 'Refuerzo anual', 'Refuerzo anual que protege a tu gato frente a las enfermedades virales felinas más comunes.', '/img/vacuna-felina.jpg'),
  ('CI002', 'Cirugía', 'Esterilización macho canino', 'Perro', '60 min', 60000, 0, 2, 2, 'Incluye anestesia', 'Cirugía de esterilización con anestesia incluida, realizada por nuestro equipo veterinario en pabellón propio.', '/img/cirugia-canina.jpg'),
  ('DE002', 'Desparasitación', 'Desparasitación interna mediana', 'Perro', '5 min', 9500, 10, 25, 5, '', 'Tratamiento antiparasitario interno para perros de 10 a 25 kg, recomendado cada tres meses.', '/img/desparasitacion.jpg'),
  ('EX003', 'Exámenes', 'Radiografía (1 proyección)', 'Perro / Gato', '20 min', 28000, 10, 6, 3, '', 'Imagen radiográfica de apoyo diagnóstico, entregada con informe del médico veterinario tratante.', '/img/radiografia.jpg'),
  ('OT001', 'Otros', 'Corte de uñas', 'Perro / Gato', '15 min', 5000, 0, 30, 5, '', 'Servicio rápido de higiene, recomendado cada 3 a 4 semanas para mascotas de vida principalmente interior.', '/img/corte-unas.jpg'),
  ('OT003', 'Otros', 'Microchip de identificación', 'Perro / Gato', '10 min', 15000, 20, 8, 3, 'Incluye registro', 'Implante de microchip subcutáneo con registro incluido, para facilitar la identificación de tu mascota.', '/img/microchip.jpg')
ON CONFLICT (codigo) DO NOTHING;
