# 📧 Configuración de Email Personalizado en Supabase

## 🚀 Paso 1: Acceder a la Configuración de Authentication

1. Ve a tu **Dashboard de Supabase**: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. En el menú lateral, ve a **Authentication** → **Email Templates**

## 📝 Paso 2: Configurar el Remitente

### Configuración del Remitente (Sender)
```
From Name: SV TOP Auth
From Email: noreply@tudominio.com
```

**Nota:** Asegúrate de usar un dominio que tengas configurado o usa el dominio por defecto de Supabase hasta que configures tu propio dominio.

## 🎨 Paso 3: Configurar Template de Confirmación

### Seleccionar Template
1. En **Email Templates**, busca **"Confirm signup"**
2. Haz clic en **"Edit"**

### Configurar Asunto del Email
```
Subject: ✅ Confirma tu cuenta en SV TOP - ¡Bienvenido gamer! 🎮
```

### Configurar Template HTML
Copia y pega el contenido completo del archivo `email-templates/confirmacion-email.html` en el campo **"Message (HTML)"**.

### Variables Disponibles en Supabase
El template usa estas variables que Supabase reemplaza automáticamente:
- `{{ .Email }}` - Email del usuario
- `{{ .ConfirmationURL }}` - URL de confirmación generada por Supabase
- `{{ .Year }}` - Año actual (puedes usar 2024 si no funciona automáticamente)

## ⚙️ Paso 4: Configuración Avanzada (Opcional)

### Configurar SMTP Personalizado
Si quieres usar tu propio servidor de email:

1. Ve a **Authentication** → **Settings**
2. Busca la sección **"SMTP Settings"**
3. Configura:
   ```
   SMTP Host: tu-servidor-smtp.com
   SMTP Port: 587 (o 465 para SSL)
   SMTP User: tu-email@tudominio.com
   SMTP Pass: tu-contraseña
   Sender Name: SV TOP Auth
   Sender Email: noreply@tudominio.com
   ```

### Rate Limiting
Para evitar spam, configura límites:
```
Max frequency: 60 seconds
Max per hour: 10 emails
```

## 🧪 Paso 5: Probar el Template

### Método 1: Registro de Usuario de Prueba
1. Ve a tu aplicación
2. Registra un usuario con un email de prueba
3. Revisa la bandeja de entrada (y spam) del email

### Método 2: Test desde Supabase
1. En **Authentication** → **Users**
2. Haz clic en **"Add user"**
3. Ingresa un email de prueba
4. Marca **"Send confirmation email"**

## 📱 Paso 6: Personalizar Otros Templates

### Recovery Email (Recuperación de Contraseña)
```
Subject: 🔑 Recupera tu contraseña - SV TOP Auth
```

### Magic Link
```
Subject: 🔗 Tu enlace mágico para SV TOP - ¡Acceso instantáneo!
```

### Invite User
```
Subject: 🎮 Te han invitado a SV TOP - ¡Únete a la comunidad gamer!
```

## 🎯 Configuración Recomendada para Producción

### 1. Dominio Personalizado
```bash
# En tu DNS, añade estos registros:
Type: CNAME
Name: mail
Value: mail.supabase.co

Type: TXT
Name: @
Value: "v=spf1 include:_spf.supabase.co ~all"
```

### 2. Configuración de Redirect URLs
En **Authentication** → **URL Configuration**:
```
Site URL: https://tudominio.com
Redirect URLs: 
- https://tudominio.com/auth/callback
- https://tudominio.com/dashboard
- https://localhost:3000/* (solo desarrollo)
```

### 3. Configuración de Rate Limiting
```
Rate Limiting:
- Max emails per hour: 30
- Max emails per minute: 2
- Minimum interval: 60 seconds
```

## 🔧 Solución de Problemas Comunes

### ❌ Email no llega
1. **Verifica spam/promociones** en Gmail
2. **Verifica Rate Limiting** - puede estar bloqueado temporalmente
3. **Revisa logs** en Authentication → Logs

### ❌ Template se ve mal
1. **Verifica HTML** - usa un validador HTML
2. **Clientes de email** tienen CSS limitado
3. **Testa en múltiples clientes**: Gmail, Outlook, Apple Mail

### ❌ Variables no se reemplazan
1. **Sintaxis correcta**: `{{ .VariableName }}`
2. **Case sensitive**: `{{ .Email }}` no `{{ .email }}`
3. **Espacios**: Sin espacios extra alrededor de las variables

### ❌ SMTP no funciona
1. **Verifica credenciales** de SMTP
2. **Firewall/Puerto** - asegúrate que el puerto esté abierto
3. **Authentication** - algunos proveedores requieren app passwords

## 📊 Monitoreo y Analytics

### Métricas Importantes
- **Delivery Rate**: % de emails entregados
- **Open Rate**: % de emails abiertos
- **Click Rate**: % de confirmaciones completadas
- **Bounce Rate**: % de emails rechazados

### Herramientas de Monitoreo
1. **Supabase Dashboard** → Authentication → Logs
2. **Google Analytics** para tracking de confirmaciones
3. **Postmark/SendGrid** para métricas avanzadas (si usas SMTP propio)

## 🚀 Mejores Prácticas

### ✅ DO (Hacer)
- Usa texto claro y call-to-action prominente
- Mantén el diseño responsive
- Incluye información de contacto
- Testa en múltiples dispositivos
- Usa preview text optimizado

### ❌ DON'T (No hacer)
- No uses JavaScript en emails
- No dependas solo de imágenes
- No hagas el email demasiado largo
- No uses muchos enlaces externos
- No olvides texto alternativo para imágenes

## 📞 Soporte

Si tienes problemas con la configuración:
1. **Documentación oficial**: https://supabase.com/docs/guides/auth/auth-email-templates
2. **Community Discord**: https://discord.supabase.com
3. **GitHub Issues**: Para reportar bugs específicos

---

**¡Listo!** Tu email personalizado está configurado con el estilo de SV TOP. Los usuarios recibirán emails profesionales y atractivos que coinciden con el diseño de tu web. 🎮✨ 