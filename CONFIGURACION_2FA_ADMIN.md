# 🔐 Sistema de Autenticación 2FA Admin

## Descripción General

Este sistema proporciona autenticación de dos factores (2FA) para proteger el acceso administrativo usando Google Authenticator. Solo el usuario `svtopadmin` puede acceder al panel de administración.

**🔑 NUEVA CARACTERÍSTICA**: Sistema de contraseña maestra para proteger el acceso inicial al setup de 2FA.

## 🏗️ Arquitectura del Sistema

### Componentes principales:

1. **`lib/admin-2fa.ts`** - Configuración base del sistema 2FA
2. **`lib/admin-setup-security.ts`** - Seguridad para acceso al setup inicial
3. **`app/api/2fa/setup/route.ts`** - Endpoint para configuración inicial
4. **`app/api/2fa/verify/route.ts`** - Endpoint para verificación de códigos
5. **`app/api/admin/setup-auth/route.ts`** - Endpoint para autenticación del setup
6. **`app/admin/auth/page.tsx`** - Página de login 2FA
7. **`app/admin/setup/page.tsx`** - Página de configuración inicial con contraseña maestra
8. **`app/admin/dashboard/page.tsx`** - Dashboard administrativo
9. **`middleware.ts`** - Middleware de protección de rutas

### Flujo de autenticación completo:

```
1. Usuario accede a /admin/setup
2. Sistema solicita contraseña maestra
3. Si es correcta, se genera cookie de sesión temporal (30 min)
4. Usuario puede generar QR code y secret 2FA
5. Configurar Google Authenticator con el QR/secret
6. Guardar secret en .env.local y reiniciar servidor
7. Usuario accede a /admin/auth
8. Ingresa username (svtopadmin) y código 2FA
9. Sistema verifica código con speakeasy
10. Se genera JWT token y cookie de sesión (8 horas)
11. Usuario es redirigido a /admin/dashboard
12. Middleware verifica token en rutas protegidas
```

## 🚀 Instalación y Configuración

### 1. Instalar dependencias

```bash
npm install speakeasy qrcode jose bcryptjs @types/speakeasy @types/qrcode @types/bcryptjs
```

### 2. Configuración inicial del 2FA

#### Paso 1: Acceder al setup protegido

1. Ve a `http://localhost:3000/admin/setup`
2. Ingresa la contraseña maestra:
   - **Desarrollo**: `svtop2024`
   - **Producción**: Configurar en `ADMIN_SETUP_PASSWORD_HASH`

#### Paso 2: Generar QR code

1. Después de autenticarte, haz clic en "Generar QR Code"
2. Escanea el código QR con Google Authenticator
3. Copia el secret mostrado en la pantalla

#### Paso 3: Configurar variables de entorno

Crea o edita el archivo `.env.local`:

```env
# Secret para 2FA (obtenido del paso anterior)
ADMIN_2FA_SECRET=TU_SECRET_AQUI

# Secret para JWT (opcional, se genera automáticamente)
JWT_SECRET=tu-jwt-secret-muy-seguro

# Hash de contraseña maestra para setup (opcional, usa svtop2024 por defecto)
ADMIN_SETUP_PASSWORD_HASH=tu-hash-de-contraseña-personalizado
```

### 3. Reiniciar el servidor

```bash
npm run dev
```

## 🔐 Seguridad del Setup

### Contraseña maestra por defecto:

- **Desarrollo**: `svtop2024`
- **Hash**: `$2b$10$9LZxcRuVtp2M9Y4uzmoENu1Ns8Ggrnqp08N6yL8NsPwhBkHMpxlJ.`

### Cambiar contraseña maestra:

```bash
# Generar nuevo hash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('TU_NUEVA_CONTRASEÑA', 10, (err, hash) => { console.log('Hash:', hash); });"

# Agregar a .env.local
ADMIN_SETUP_PASSWORD_HASH=hash-generado-aqui
```

### Características de seguridad del setup:

- **Sesión temporal**: 30 minutos de duración
- **Contraseña cifrada**: Usando bcrypt con salt 10
- **Cookie HTTP-only**: Para prevenir acceso por JavaScript
- **Validación de tokens**: Verificación de expiración automática
- **Acceso único**: Solo disponible si 2FA no está configurado

## 📱 Configuración de Google Authenticator

### Paso a paso:

1. **Descarga Google Authenticator**
   - Android: Google Play Store
   - iOS: App Store

2. **Agregar cuenta**
   - Abre Google Authenticator
   - Toca "+" para agregar cuenta
   - Selecciona "Escanear código QR"

3. **Escanear QR**
   - Escanea el código QR generado en `/admin/setup`
   - O ingresa manualmente el secret

4. **Configuración manual** (si no puedes escanear):
   - Cuenta: `GameServers Hub Admin (svtopadmin)`
   - Clave: `[TU_SECRET_AQUI]`
   - Tipo: Basado en tiempo

## 🔑 Uso del Sistema

### Configuración inicial (solo una vez):

1. Ve a `http://localhost:3000/admin/setup`
2. Ingresa contraseña maestra: `svtop2024`
3. Genera QR code y configura Google Authenticator
4. Guarda el secret en `.env.local`
5. Reinicia el servidor

### Acceso al panel admin:

1. Ve a `http://localhost:3000/admin/auth`
2. Ingresa:
   - Usuario: `svtopadmin`
   - Código: Código de 6 dígitos de Google Authenticator
3. Haz clic en "Acceder al Admin"

### Logout:

- Usa el botón "Cerrar Sesión" en el dashboard
- O elimina la cookie `admin-session`

## 🛡️ Seguridad

### Características de seguridad:

- **Doble autenticación**: Contraseña maestra + 2FA
- **Contraseña cifrada**: bcrypt con salt 10
- **Sesiones temporales**: Setup (30 min) + Admin (8 horas)
- **Tokens JWT** con expiración
- **Cookies HTTP-only** para prevenir acceso por JavaScript
- **Middleware de protección** en todas las rutas admin
- **Validación de ventana de tiempo** para códigos 2FA
- **Logging detallado** de intentos de acceso

### Variables de entorno críticas:

```env
# ⚠️ NUNCA COMMITEAR ESTOS VALORES
ADMIN_2FA_SECRET=secret-muy-seguro-32-caracteres
JWT_SECRET=jwt-secret-muy-seguro-y-largo
ADMIN_SETUP_PASSWORD_HASH=hash-bcrypt-de-contraseña-maestra
```

## 🔧 Troubleshooting

### Problema: "Acceso no autorizado al setup"

1. Ve a `/admin/setup` nuevamente
2. Ingresa la contraseña maestra: `svtop2024`
3. La sesión expira después de 30 minutos

### Problema: "Contraseña incorrecta" en setup

1. Verifica que usas: `svtop2024` (en desarrollo)
2. Si cambiaste la contraseña, verifica el hash en `.env.local`
3. Asegúrate de que `ADMIN_SETUP_PASSWORD_HASH` esté correcto

### Problema: "2FA ya está configurado"

- Si necesitas reconfigurar, elimina `ADMIN_2FA_SECRET` de `.env.local`
- Reinicia el servidor
- Vuelve a acceder al setup

### Problema: "Código 2FA inválido"

1. Verifica que el reloj esté sincronizado
2. Asegúrate de usar el código más reciente
3. Verifica que el secret en `.env.local` sea correcto

## 🛠️ Desarrollo

### Estructura de archivos:

```
app/
├── admin/
│   ├── auth/page.tsx           # Login 2FA
│   ├── setup/page.tsx          # Configuración inicial con contraseña
│   └── dashboard/page.tsx      # Dashboard admin
├── api/
│   ├── admin/
│   │   └── setup-auth/route.ts # Verificar contraseña maestra
│   └── 2fa/
│       ├── setup/route.ts      # Generar QR (protegido)
│       └── verify/route.ts     # Verificar código
lib/
├── admin-2fa.ts                # Configuración base 2FA
└── admin-setup-security.ts     # Seguridad del setup
middleware.ts                   # Protección de rutas
```

### Endpoints disponibles:

- `POST /api/admin/setup-auth` - Verificar contraseña maestra
- `GET /api/2fa/setup` - Verificar estado de configuración
- `POST /api/2fa/setup` - Generar QR code y secret (requiere autenticación)
- `POST /api/2fa/verify` - Verificar código 2FA
- `DELETE /api/2fa/verify` - Logout (eliminar cookie)

### Rutas protegidas:

- `/admin/dashboard` - Dashboard principal (requiere 2FA)
- `/admin/*` - Todas las rutas admin (excepto `/admin/auth` y `/admin/setup`)

### Rutas con protección especial:

- `/admin/setup` - Requiere contraseña maestra
- `/admin/auth` - Requiere código 2FA

## 📊 Monitoreo y Logs

### Logs importantes:

```bash
# Setup
✅ Acceso al setup autorizado
🚨 Intento de acceso al setup con contraseña incorrecta

# Login 2FA
✅ Login 2FA exitoso para: svtopadmin
🚨 Intento de login con username inválido: [username]
🚨 Código 2FA inválido para usuario: [username]

# Acceso
✅ Acceso admin autorizado: svtopadmin a /admin/dashboard
🚨 Acceso denegado: No hay token de sesión
🚨 Acceso denegado: Token JWT inválido
```

## 🔄 Mantenimiento

### Cambiar contraseña maestra:

1. Genera nuevo hash: `node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('NUEVA_CONTRASEÑA', 10, (err, hash) => { console.log(hash); });"`
2. Actualiza `ADMIN_SETUP_PASSWORD_HASH` en `.env.local`
3. Reinicia servidor

### Cambiar secret 2FA:

1. Elimina `ADMIN_2FA_SECRET` de `.env.local`
2. Reinicia servidor
3. Ve a `/admin/setup` con contraseña maestra
4. Genera nuevo QR code y secret
5. Reconfigura Google Authenticator

## 📋 Checklist de configuración:

- [ ] Dependencias instaladas
- [ ] Acceso a `/admin/setup` con contraseña maestra
- [ ] Secret 2FA generado
- [ ] Google Authenticator configurado
- [ ] Variables de entorno configuradas
- [ ] Servidor reiniciado
- [ ] Login 2FA probado exitosamente
- [ ] Rutas protegidas funcionando
- [ ] Logout funcionando

## 🆘 Soporte

Si tienes problemas con la configuración:

1. Revisa los logs del servidor
2. Verifica que todas las variables estén configuradas
3. Asegúrate de que Google Authenticator esté sincronizado
4. Prueba limpiar cookies y volver a hacer login
5. Verifica la contraseña maestra en desarrollo: `svtop2024`

---

**⚠️ IMPORTANTES**:
- **Contraseña maestra por defecto**: `svtop2024` (solo desarrollo)
- **Cambiar contraseña** en producción usando `ADMIN_SETUP_PASSWORD_HASH`
- **Sistema de doble protección**: Contraseña maestra + 2FA
- **Sesiones temporales**: 30 min setup / 8 horas admin 