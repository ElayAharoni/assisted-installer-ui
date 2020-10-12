import React from 'react';
import { Text, TextContent, Button } from '@patternfly/react-core';
import HostsTable from '../hosts/HostsTable';
import { Cluster, HostRequirements as HostRequirementsType } from '../../api/types';
import { DiscoveryImageModalButton } from './discoveryImageModal';
import {
  HostsNotShowingLink,
  DiscoveryTroubleshootingModal,
} from './DiscoveryTroubleshootingModal';
import { getHostRequirements } from '../../api/hostRequirements';
import { getErrorMessage, handleApiError } from '../../api';
import { addAlert } from '../../features/alerts/alertsSlice';
import { BareMetalInventoryVariant } from './types';

type BareMetalInventoryProps = {
  cluster: Cluster;
  variant?: BareMetalInventoryVariant;
};

const HostRequirementsText: React.FC<{ hostRequirements?: HostRequirementsType }> = ({
  hostRequirements,
}) => (
  <Text component="p">
    Three master hosts are required with at least {hostRequirements?.master?.cpuCores || 4} CPU
    cores, {hostRequirements?.master?.ramGib || 16} GB of RAM, and{' '}
    {hostRequirements?.master?.diskSizeGb || 120} GB of filesystem storage each. Two or more
    additional worker hosts are recommended with at least {hostRequirements?.worker?.cpuCores || 2}{' '}
    CPU cores, {hostRequirements?.worker?.ramGib || 8} GB of RAM, and{' '}
    {hostRequirements?.worker?.diskSizeGb || 120}
    GB of filesystem storage each.
  </Text>
);

const WorkerRequirementsText: React.FC<{ hostRequirements?: HostRequirementsType }> = ({
  hostRequirements,
}) => (
  <Text component="p">
    Worker hosts are required to be equiped by at least {hostRequirements?.worker?.cpuCores || 2}{' '}
    CPU cores, {hostRequirements?.worker?.ramGib || 8} GB of RAM, and{' '}
    {hostRequirements?.worker?.diskSizeGb || 120}
    GB of filesystem storage each.
  </Text>
);

export const HostRequirements: React.FC<{
  HostRequirementsTextComponent: React.FC<{ hostRequirements?: HostRequirementsType }>;
}> = ({ HostRequirementsTextComponent }) => {
  const [hostRequirements, setHostRequirements] = React.useState<HostRequirementsType>();

  React.useEffect(() => {
    const fetchFunc = async () => {
      try {
        const { data } = await getHostRequirements();
        setHostRequirements(data);
      } catch (e) {
        handleApiError(e, () =>
          addAlert({
            title: 'Failed to retrieve minimum host requierements',
            message: getErrorMessage(e),
          }),
        );
      }
    };
    fetchFunc();
  }, [setHostRequirements]);

  return <HostRequirementsTextComponent hostRequirements={hostRequirements} />;
};

const BaremetalInventory: React.FC<BareMetalInventoryProps> = ({
  cluster,
  variant = 'Cluster',
}) => {
  const [isDiscoveryHintModalOpen, setDiscoveryHintModalOpen] = React.useState(false);

  return (
    <>
      <TextContent>
        {variant === 'AddHostsCluster' && <Text component="h2">Bare Metal Inventory</Text>}
        <Text component="p">
          <DiscoveryImageModalButton ButtonComponent={Button} cluster={cluster} />
        </Text>
        <Text component="p">
          Boot the Discovery ISO on hardware that should become part of this bare metal cluster.
          Hosts connected to the internet will be inspected and automatically appear below.{' '}
          <HostsNotShowingLink setDiscoveryHintModalOpen={setDiscoveryHintModalOpen} />
        </Text>
        <HostRequirements
          HostRequirementsTextComponent={
            variant === 'Cluster' ? HostRequirementsText : WorkerRequirementsText
          }
        />
      </TextContent>
      <HostsTable
        cluster={cluster}
        setDiscoveryHintModalOpen={setDiscoveryHintModalOpen}
        variant={variant}
      />
      <DiscoveryTroubleshootingModal
        isOpen={isDiscoveryHintModalOpen}
        setDiscoveryHintModalOpen={setDiscoveryHintModalOpen}
      />
    </>
  );
};

export default BaremetalInventory;
