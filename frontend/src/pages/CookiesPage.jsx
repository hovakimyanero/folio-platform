export default function CookiesPage() {
  return (
    <div style={{ paddingTop: 120, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px 80px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: '-0.03em', marginBottom: 16 }}>Политика Cookies</h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 48 }}>Последнее обновление: 1 апреля 2026 г.</p>

        <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.9, display: 'flex', flexDirection: 'column', gap: 32 }}>
          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>1. Что такое cookies</h2>
            <p>Cookies (куки) — это небольшие текстовые файлы, которые сохраняются на вашем устройстве при посещении веб-сайта. Они позволяют сайту запоминать ваши действия и настройки.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>2. Какие cookies мы используем</h2>
            <p><strong>Необходимые cookies:</strong> Эти cookies обеспечивают базовую функциональность Платформы. К ним относятся: токен авторизации (accessToken) — необходим для поддержания сессии пользователя; токен обновления (refreshToken) — используется для автоматического продления сессии. Без этих cookies авторизация на Платформе невозможна.</p>
            <p style={{ marginTop: 12 }}><strong>Функциональные cookies:</strong> Используются для сохранения ваших предпочтений (тема оформления, язык интерфейса).</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>3. Cookies третьих сторон</h2>
            <p>Мы не используем cookies третьих сторон для рекламы или трекинга. Сторонние сервисы, обеспечивающие работу Платформы (Netlify, Railway), могут устанавливать свои технические cookies для обеспечения производительности и безопасности.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>4. Срок хранения cookies</h2>
            <p>Токен авторизации (accessToken): 15 минут. Токен обновления (refreshToken): 7 дней. Функциональные cookies: до 1 года.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>5. Управление cookies</h2>
            <p>Вы можете управлять cookies через настройки вашего браузера. Вы можете удалить все cookies или настроить браузер на блокировку cookies. Обратите внимание, что отключение необходимых cookies сделает авторизацию на Платформе невозможной.</p>
          </section>

          <section>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>6. Согласие на использование cookies</h2>
            <p>Продолжая использовать Платформу, вы соглашаетесь на использование cookies в соответствии с настоящей Политикой. Вы можете отозвать своё согласие в любое время, удалив cookies через настройки браузера.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
