import React, { PropsWithChildren, ReactNode } from 'react'

type ClassName = string | undefined

export const Section: React.FC<PropsWithChildren<{ className?: ClassName }>> = ({ children, className }) => {
  return <div className={`content-section${className ? ` ${className}` : ''}`}>{children}</div>
}

export const SectionTitle: React.FC<PropsWithChildren<{ className?: ClassName }>> = ({ children, className }) => {
  return <h3 className={`section-title${className ? ` ${className}` : ''}`}>{children}</h3>
}

export const SectionItems: React.FC<PropsWithChildren<{ className?: ClassName }>> = ({ children, className }) => {
  return <div className={`settings-items${className ? ` ${className}` : ''}`}>{children}</div>
}

interface SettingItemProps {
  title: ReactNode
  description?: ReactNode
  className?: ClassName
  right?: ReactNode
}

export const SettingItem: React.FC<PropsWithChildren<SettingItemProps>> = ({ title, description, right, children, className }) => {
  return (
    <div className={`setting-item${className ? ` ${className}` : ''}`}>
      <div className="setting-info">
        <span className="setting-name">{title}</span>
        {description ? <span className="setting-desc">{description}</span> : null}
      </div>
      {/* 优先使用 right，其次使用 children 作为右侧控制区域 */}
      {right ?? children}
    </div>
  )
}

type ButtonVariant = 'default' | 'primary' | 'secondary' | 'danger'

export const SettingButton: React.FC<{
  variant?: ButtonVariant
  className?: ClassName
  onClick?: () => void
  children: ReactNode
}> = ({ variant = 'default', className, onClick, children }) => {
  const variantClass = variant === 'primary' ? ' primary' : variant === 'secondary' ? ' secondary' : variant === 'danger' ? ' danger' : ''
  return (
    <button className={`setting-button${variantClass}${className ? ` ${className}` : ''}`} onClick={onClick}>
      {children}
    </button>
  )
}

export default {
  Section,
  SectionTitle,
  SectionItems,
  SettingItem,
  SettingButton,
}


