import React from 'react';
import { ClusterWizardStep, getFormikErrorFields, useAlerts } from '../../../../common';
import { useClusterWizardContext } from '../ClusterWizardContext';
import ClusterWizardFooter from '../ClusterWizardFooter';
import ClusterWizardNavigation from '../ClusterWizardNavigation';
import { StaticIpFormState } from '../../clusterConfiguration/staticIp/components/propTypes';
import { StaticIpPage } from '../../clusterConfiguration/staticIp/components/StaticIpPage';
import { WithErrorBoundary } from '../../../../common/components/ErrorHandling/WithErrorBoundary';
import { InfraEnvsAPI } from '../../../services/apis';
import { InfraEnvUpdateParams } from '@openshift-assisted/types/assisted-installer-service';

const getInitialFormStateProps = (): StaticIpFormState => {
  return {
    isValid: true,
    isSubmitting: false,
    isAutoSaveRunning: false,
    errors: {},
    touched: {},
    isEmpty: true,
  };
};

const DisconnectedStaticIp: React.FC = () => {
  const { moveNext, moveBack, disconnectedInfraEnv, setDisconnectedInfraEnv } =
    useClusterWizardContext();
  const { alerts } = useAlerts();
  const [formState, setFormStateProps] = React.useState<StaticIpFormState>(
    getInitialFormStateProps(),
  );

  const onFormStateChange = React.useCallback((formState: StaticIpFormState) => {
    setFormStateProps(formState);
  }, []);

  const updateInfraEnv = React.useCallback(
    async (params: InfraEnvUpdateParams) => {
      if (!disconnectedInfraEnv?.id) {
        throw new Error('No disconnected infraEnv available');
      }
      const { data: updatedInfraEnv } = await InfraEnvsAPI.update(disconnectedInfraEnv.id, params);
      setDisconnectedInfraEnv({
        ...updatedInfraEnv,
        hostsNetworkConfigurationType: disconnectedInfraEnv.hostsNetworkConfigurationType,
      });
      return updatedInfraEnv;
    },
    [disconnectedInfraEnv, setDisconnectedInfraEnv],
  );

  const isNextDisabled = !formState.isValid || !!alerts.length || formState.isSubmitting;
  const errorFields = getFormikErrorFields<object>(formState.errors, formState.touched);
  const handleNext = React.useCallback(() => moveNext(), [moveNext]);
  const handleBack = React.useCallback(() => moveBack(), [moveBack]);

  const footer = (
    <ClusterWizardFooter
      alertTitle="Static IP configuration contains missing or invalid fields"
      alertContent={null}
      errorFields={errorFields}
      isSubmitting={formState.isSubmitting}
      onNext={handleNext}
      onBack={handleBack}
      isNextDisabled={isNextDisabled}
      isBackDisabled={formState.isSubmitting}
    />
  );

  if (!disconnectedInfraEnv) {
    return null;
  }

  return (
    <ClusterWizardStep navigation={<ClusterWizardNavigation />} footer={footer}>
      <WithErrorBoundary title="Failed to load Static IP step">
        <StaticIpPage
          infraEnv={disconnectedInfraEnv}
          updateInfraEnv={updateInfraEnv}
          onFormStateChange={onFormStateChange}
        />
      </WithErrorBoundary>
    </ClusterWizardStep>
  );
};

export default DisconnectedStaticIp;
