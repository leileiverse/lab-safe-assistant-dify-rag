import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/Icon';

export default function LoginPage() {
  const { login } = useAuth();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = useCallback(async () => {
    const pw = input.trim();
    if (!pw) {
      setError('请输入密码');
      return;
    }
    setChecking(true);
    setError('');
    try {
      // 必须调用受服务端密码保护的专用接口；/health 是公开监测接口，
      // 不能用于验证登录密码。
      const r = await fetch('/api/auth/check', {
        headers: { 'x-password': pw },
      });
      if (r.ok) {
        login(pw);
        window.location.hash = '/';
      } else {
        setError('密码错误');
      }
    } catch (e) {
      setError('网络错误，请重试');
    } finally {
      setChecking(false);
    }
  }, [input, login]);

  return (
    <main className="login-page">
      <div className="login-grid" aria-hidden="true" />
      <div className="login-scanline" aria-hidden="true" />
      <section className="login-intro" aria-label="平台介绍">
        <div className="login-brand">
          <div className="login-brand-mark"><Icon name="flask" size={26} stroke={1.8} /></div>
          <div><strong>实验室安全小助手</strong><span>LAB SAFETY INTELLIGENCE</span></div>
        </div>
        <div className="login-copy">
          <p className="login-eyebrow"><span /> SAFETY OPERATIONS CENTER</p>
          <h1>让每一次实验<br />都有可靠依据</h1>
          <p>聚合安全规范、知识库与规则引擎，为实验室场景提供清晰、可追溯的安全建议。</p>
        </div>
        <div className="login-signal-list">
          <div><Icon name="shield" size={16} /><span>规则校验与风险分级</span><b>ACTIVE</b></div>
          <div><Icon name="database" size={16} /><span>本地知识库检索链路</span><b>READY</b></div>
          <div><Icon name="activity" size={16} /><span>安全服务状态监测</span><b>ONLINE</b></div>
        </div>
      </section>
      <section className="login-access" aria-label="系统登录">
        <div className="login-card">
          <div className="login-card-head">
            <div className="login-lock"><Icon name="lock" size={18} /></div>
            <div><p>身份验证</p><h2>进入安全工作台</h2></div>
          </div>
          <label className={`login-field ${error ? 'has-error' : ''}`}>
            <span>访问密码</span>
            <div className="login-input-wrap">
              <Icon name="lock" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={input}
                autoComplete="current-password"
                onChange={(e) => { setInput(e.target.value); setError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
                placeholder="密码"
                aria-describedby={error ? 'login-error' : undefined}
              />
              <button type="button" className="password-toggle" title={showPassword ? '隐藏密码' : '显示密码'} aria-label={showPassword ? '隐藏密码' : '显示密码'} onClick={() => setShowPassword((value) => !value)}>
                <Icon name={showPassword ? 'eyeOff' : 'eye'} size={17} />
              </button>
            </div>
          </label>
          <div id="login-error" className={`login-error ${error ? 'visible' : ''}`} role="alert">{error}</div>
          <button className="login-submit" onClick={submit} disabled={checking}>
            <span>{checking ? '正在验证身份' : '进入系统'}</span>
            {checking ? <span className="login-loader" /> : <Icon name="arrowRight" size={18} />}
          </button>
          <p className="login-notice"><Icon name="shield" size={13} /> 本次访问将由服务端进行安全校验</p>
        </div>
        <p className="login-footer">LABSAFE / SECURE ACCESS / 2026</p>
      </section>
    </main>
  );
}
