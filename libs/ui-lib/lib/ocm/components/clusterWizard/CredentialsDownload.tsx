import React from 'react';
import {
  ClusterCredentials,
  ClustersAPI,
  ClusterWizardStep,
  ClusterWizardStepHeader,
  getApiErrorMessage,
  handleApiError,
  KUBECONFIG_INFO_LINK,
  useAlerts,
  useTranslation,
} from '../../../common';
import { useClusterWizardContext } from './ClusterWizardContext';
import ClusterWizardFooter from './ClusterWizardFooter';
import ClusterWizardNavigation from './ClusterWizardNavigation';
import { WithErrorBoundary } from '../../../common/components/ErrorHandling/WithErrorBoundary';
import { Cluster, Credentials } from '@openshift-assisted/types/assisted-installer-service';
import { Alert, AlertVariant, Checkbox, Grid, Stack } from '@patternfly/react-core';
import { downloadFile, getErrorMessage } from '../../../common/utils';
import { ExternalLinkAltIcon } from '@patternfly/react-icons/dist/js/icons/external-link-alt-icon';

const CredentialsDownload: React.FC<{ cluster: Cluster }> = ({ cluster }) => {
  const clusterWizardContext = useClusterWizardContext();
  const [isChecked, setIsChecked] = React.useState<boolean>(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [credentials, setCredentials] = React.useState<Credentials>();
  const [credentialsError, setCredentialsError] = React.useState<string>();
  const { addAlert } = useAlerts();
  const { t } = useTranslation();

  React.useEffect(() => {
    const fetch = async () => {
      setCredentialsError(undefined);
      if (!cluster.id) {
        return;
      }
      try {
        const response = await ClustersAPI.getCredentials(cluster.id);
        const data = { username: response.data.username, password: response.data.password };
        setCredentials(data);
      } catch (err) {
        handleApiError(err, (err) => {
          setCredentialsError(`Failed to fetch credentials, ${getErrorMessage(err)}`);
        });
      }
    };
    void fetch();
  }, [cluster.id, setCredentials]);

  const downloadSingleFile = async (fileName: string) => {
    try {
      const response = await ClustersAPI.downloadClusterCredentials(cluster.id, fileName);
      downloadFile('', response.data, fileName);
      return true;
    } catch (e) {
      handleApiError(e, (e) => {
        addAlert({
          title: t('ai:Could not download {{fileName}} file', { fileName }),
          message: getApiErrorMessage(e),
        });
      });
      return false;
    }
  };

  const handleDownloadClick = async () => {
    setIsDownloading(true);

    const configSuccess = await downloadSingleFile('kubeconfig');
    const passwordSuccess = await downloadSingleFile('kubeadmin-password');

    const hasError = !configSuccess || !passwordSuccess;

    setTimeout(() => {
      setIsDownloading(false);

      if (!hasError) {
        clusterWizardContext.moveNext();
      }
    }, 500);
  };

  const footer = (
    <ClusterWizardFooter
      cluster={cluster}
      onNext={() => void handleDownloadClick()}
      onBack={() => clusterWizardContext.moveBack()}
      isNextDisabled={!isChecked || isDownloading}
      nextButtonText={t('ai:Download credentials')}
      isNextButtonLoading={isDownloading}
    />
  );

  return (
    <ClusterWizardStep navigation={<ClusterWizardNavigation cluster={cluster} />} footer={footer}>
      <WithErrorBoundary title={t('ai:Failed to load Credentials Download step')}>
        <Stack hasGutter>
          <ClusterWizardStepHeader>{t('ai:Download credentials')}</ClusterWizardStepHeader>
          <Alert
            title={t('ai:Make sure you download and store your credentials files in a safe place')}
            variant={AlertVariant.warning}
            isInline
            actionLinks={
              <a href={KUBECONFIG_INFO_LINK} target="_blank" rel="noopener noreferrer">
                {t('ai:Learn more about Kubeconfig')} <ExternalLinkAltIcon />
              </a>
            }
          >
            {t(`ai:You should use your cluster's Kubeconfig file to gain access to the cluster.`)}
            <br />
            {t(`ai:You can use username and password to log-in to your console through the UI.`)}
          </Alert>
          <Checkbox
            id="credentials-download-agreement"
            isChecked={isChecked}
            onChange={() => setIsChecked(!isChecked)}
            label={t(
              'ai:I understand that I need to download credentials files prior of proceeding with the cluster installation.',
            )}
          />
          <Grid hasGutter style={{ justifyItems: 'start' }}>
            <ClusterCredentials
              cluster={cluster}
              credentials={credentials}
              credentialsError={credentialsError}
              error={!!credentialsError}
            />
          </Grid>
        </Stack>
      </WithErrorBoundary>
    </ClusterWizardStep>
  );
};

export default CredentialsDownload;
