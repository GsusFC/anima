import { h } from 'preact'
import { Text, Button, VerticalSpace } from '@create-figma-plugin/ui'

interface HeaderProps {
  user?: {
    name: string
    email: string
    plan: string
  }
  onLogout: () => void
}

export function Header({ user, onLogout }: HeaderProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      borderBottom: '1px solid #e5e5e5',
      backgroundColor: '#ffffff'
    }}>
      {/* Logo y título */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '24px',
          height: '24px',
          backgroundColor: '#ec4899',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          A
        </div>
        <Text style={{ fontWeight: '600', fontSize: '14px' }}>
          AnimaGen
        </Text>
      </div>

      {/* Info del usuario y logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {user && (
          <div style={{ textAlign: 'right' }}>
            <Text style={{ fontSize: '12px', fontWeight: '500' }}>
              {user.name}
            </Text>
            <Text style={{ fontSize: '11px', color: '#6b7280' }}>
              {user.plan}
            </Text>
          </div>
        )}
        
        <Button
          secondary
          onClick={onLogout}
          style={{
            padding: '4px 8px',
            fontSize: '11px',
            minHeight: '24px'
          }}
        >
          Logout
        </Button>
      </div>
    </div>
  )
}
