import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components';

interface Props {
  /** 站点名，默认 Your SaaS */
  appName?: string;
}

/** Pre-launch waitlist 确认邮件。 */
export default function WaitlistEmail({ appName = 'Your SaaS' }: Props) {
  return (
    <Html>
      <Head />
      <Preview>You&apos;re on the {appName} waitlist</Preview>
      <Body style={{ backgroundColor: '#f4f3ee', fontFamily: 'sans-serif' }}>
        <Container style={{ background: '#ffffff', borderRadius: 12, padding: 28, marginTop: 24 }}>
          <Heading style={{ color: '#0f766e', fontSize: 22 }}>You&apos;re on the list</Heading>
          <Text style={{ color: '#374151', fontSize: 15, lineHeight: '24px' }}>
            Thanks for your interest in {appName}. We&apos;ll let you know when the full experience
            is ready, plus occasional launch updates.
          </Text>
          <Text style={{ color: '#9ca3af', fontSize: 12 }}>
            You can ignore this email if you didn&apos;t sign up.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
