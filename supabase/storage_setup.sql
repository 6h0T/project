-- Configuración del storage para imágenes de banners

-- Crear bucket para imágenes si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  2097152, -- 2MB en bytes
  ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png', 
    'image/gif',
    'image/webp'
  ];

-- Política para permitir que usuarios autenticados suban imágenes
CREATE POLICY "Usuarios autenticados pueden subir imágenes" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'images' 
    AND auth.role() = 'authenticated'
  );

-- Política para que todos puedan ver las imágenes (público)
CREATE POLICY "Cualquiera puede ver imágenes" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

-- Política para que los usuarios puedan actualizar sus propias imágenes
CREATE POLICY "Usuarios pueden actualizar sus imágenes" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'images' 
    AND auth.role() = 'authenticated'
  );

-- Política para que los usuarios puedan eliminar sus propias imágenes
CREATE POLICY "Usuarios pueden eliminar sus imágenes" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'images' 
    AND auth.role() = 'authenticated'
  );

-- Verificar que el bucket se creó correctamente
SELECT * FROM storage.buckets WHERE id = 'images'; 