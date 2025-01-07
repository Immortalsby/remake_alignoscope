import { useTranslations } from 'next-intl';
import * as Accordion from '@radix-ui/react-accordion';
import styles from './HelpAccordion.module.css';

export default function HelpAccordion() {
  const t = useTranslations();

  return (
    <Accordion.Root type="single" className={`${styles.accordionRoot} mb-4`} collapsible>
      <Accordion.Item value="item-1" className={styles.accordionItem}>
        <Accordion.Header className={styles.accordionHeader}>
          <Accordion.Trigger className={styles.accordionTrigger}>
            {t('howto')}
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content className={styles.accordionContent}>
          <div className={styles.accordionBody} dangerouslySetInnerHTML={{ __html: t.raw('manual') }} />
        </Accordion.Content>
      </Accordion.Item>

      <Accordion.Item value="item-2" className={styles.accordionItem}>
        <Accordion.Header className={styles.accordionHeader}>
          <Accordion.Trigger className={styles.accordionTrigger}>
            {t('presentation')}
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content className={styles.accordionContent}>
          <div className={styles.accordionBody} dangerouslySetInnerHTML={{ __html: t.raw('pres') }} />
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
}
