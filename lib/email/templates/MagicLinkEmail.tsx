import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface Props {
  url: string;
  /** 站点名，默认 Your SaaS */
  appName?: string;
}

/** 登录魔法链接邮件（React Email）。appName 可在接入业务时通过 env 注入。 */
export default function MagicLinkEmail({ url, appName = 'Your SaaS' }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Your secure sign-in link for {appName}</Preview>
      <Body style={{ backgroundColor: '#f4f3ee', fontFamily: 'sans-serif' }}>
        <Container
          style={{
            background: '#ffffff',
            borderRadius: 12,
            padding: 28,
            marginTop: 24,
          }}
        >
          <Heading style={{ color: '#0f766e', fontSize: 22 }}>Sign in to {appName}</Heading>
          <Text style={{ color: '#374151', fontSize: 15 }}>
            Click the button below to sign in. This link expires in 15 minutes and can be used once.
          </Text>
          <Section style={{ margin: '20px 0' }}>
            <Button
              href={url}
              style={{
                backgroundColor: '#0f766e',
                color: '#fff',
                borderRadius: 8,
                padding: '12px 22px',
                fontWeight: 600,
              }}
            >
              Sign in
            </Button>
          </Section>
          <Text style={{ color: '#6b7280', fontSize: 13 }}>
            Or copy this link: <br />
            <Link href={url} style={{ color: '#0f766e', wordBreak: 'break-all' }}>
              {url}
            </Link>
          </Text>
          <Text style={{ color: '#9ca3af', fontSize: 12 }}>
            If you didn&apos;t request this, you can ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
