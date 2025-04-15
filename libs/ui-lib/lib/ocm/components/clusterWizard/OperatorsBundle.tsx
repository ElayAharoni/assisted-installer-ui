import * as React from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Gallery,
  GalleryItem,
  List,
  ListItem,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Title,
  Tooltip,
} from '@patternfly/react-core';
import {
  Bundle,
  PreflightHardwareRequirements,
} from '@openshift-assisted/types/assisted-installer-service';
import NewFeatureSupportLevelBadge from '../../../common/components/newFeatureSupportLevels/NewFeatureSupportLevelBadge';
import { ExternalLink, OperatorsValues, PopoverIcon, singleClusterBundles } from '../../../common';
import { useFormikContext } from 'formik';
import { useNewFeatureSupportLevel } from '../../../common/components/newFeatureSupportLevels';
import { useFeature } from '../../hooks/use-feature';
import { useSelector } from 'react-redux';
import { selectIsCurrentClusterSNO } from '../../store/slices/current-cluster/selectors';
import { getNewBundleOperators } from '../clusterConfiguration/operators/utils';
import { bundleSpecs } from '../clusterConfiguration/operators/bundleSpecs';
import { useOperatorSpecs } from '../../../common/components/operators/operatorSpecs';

import './OperatorsBundle.css';

const BundleLabel = ({ bundle }: { bundle: Bundle }) => {
  const opSpecs = useOperatorSpecs();
  const bundleSpec = bundleSpecs[bundle.id || ''];

  return (
    <>
      <span>{bundle.title} </span>
      <PopoverIcon
        component={'a'}
        headerContent={<div>Requirements and dependencies</div>}
        bodyContent={
          <Stack hasGutter>
            {bundleSpec?.Description && (
              <StackItem>
                <bundleSpec.Description />
              </StackItem>
            )}
            {bundle.operators?.length && (
              <>
                <StackItem>Bundle operators:</StackItem>
                <StackItem>
                  <List>
                    {bundle.operators.map((op) => (
                      <ListItem key={op}>{opSpecs[op]?.title || op}</ListItem>
                    ))}
                  </List>
                </StackItem>
              </>
            )}
            {bundleSpec?.docsLink && (
              <StackItem>
                <ExternalLink href={bundleSpec.docsLink}>Learn more</ExternalLink>
              </StackItem>
            )}
          </Stack>
        }
      />
    </>
  );
};

const BundleCard = ({
  bundle,
  bundles,
  preflightRequirements,
}: {
  bundle: Bundle;
  bundles: Bundle[];
  preflightRequirements: PreflightHardwareRequirements | undefined;
}) => {
  const { values, setFieldValue } = useFormikContext<OperatorsValues>();
  const isSNO = useSelector(selectIsCurrentClusterSNO);
  const { isFeatureSupported } = useNewFeatureSupportLevel();
  const opSpecs = useOperatorSpecs();

  const hasUnsupportedOperators = !!bundle.operators?.some((op) => {
    const operatorSpec = opSpecs[op];
    if (!operatorSpec) {
      return false;
    }
    return !isFeatureSupported(operatorSpec.featureId);
  });

  const bundleSpec = bundleSpecs[bundle.id || ''];

  const incompatibleBundle = bundleSpec?.incompatibleBundles?.find((b) =>
    values.selectedBundles.includes(b),
  );

  const disabledReason = hasUnsupportedOperators
    ? 'Some operators in this bundle are not supported with the current configuration.'
    : isSNO && bundleSpec?.noSNO
    ? 'This bundle is not available when deploying a Single Node OpenShift.'
    : incompatibleBundle
    ? `Bundle cannot be installed together with ${
        bundles.find(({ id }) => id === incompatibleBundle)?.title || incompatibleBundle
      }`
    : undefined;

  const onSelect = (checked: boolean) => {
    const newBundles = checked
      ? [...values.selectedBundles, bundle.id || '']
      : values.selectedBundles.filter((sb) => sb !== bundle.id);
    setFieldValue('selectedBundles', newBundles);
    const newOperators = getNewBundleOperators(
      values.selectedOperators,
      newBundles,
      bundles,
      bundle,
      preflightRequirements,
      checked,
    );
    setFieldValue('selectedOperators', newOperators);
  };

  const isSelected = values.selectedBundles.includes(bundle.id || '');
  const checkboxId = `bundle-${bundle.id || ''}`;
  return (
    <Tooltip content={disabledReason} hidden={!disabledReason}>
      <Card
        isDisabled={!!disabledReason}
        isFullHeight
        isSelectable
        isSelected={isSelected}
        className="ai-bundle-card"
      >
        <CardHeader
          selectableActions={{
            selectableActionId: checkboxId,
            selectableActionAriaLabelledby: checkboxId,
            name: checkboxId,
            onChange: (_, checked) => onSelect(checked),
            isChecked: isSelected,
          }}
        >
          <CardTitle>
            <BundleLabel bundle={bundle} />
          </CardTitle>
        </CardHeader>
        <CardBody isFilled>
          <Stack hasGutter>
            <StackItem isFilled>
              <div>{bundle.description}</div>
            </StackItem>
            {bundleSpec.featureId && (
              <StackItem>
                <Split>
                  <SplitItem isFilled />
                  <SplitItem>
                    <NewFeatureSupportLevelBadge
                      featureId={bundleSpec.featureId}
                      supportLevel="dev-preview"
                    />
                  </SplitItem>
                </Split>
              </StackItem>
            )}
          </Stack>
        </CardBody>
      </Card>
    </Tooltip>
  );
};

const OperatorsBundle = ({
  bundles,
  preflightRequirements,
}: {
  bundles: Bundle[];
  preflightRequirements: PreflightHardwareRequirements | undefined;
}) => {
  const isSingleClusterFeatureEnabled = useFeature('ASSISTED_INSTALLER_SINGLE_CLUSTER_FEATURE');

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2" size="lg">
          Bundles
        </Title>
      </StackItem>
      <StackItem>
        <Gallery hasGutter minWidths={{ default: '350px' }}>
          {(isSingleClusterFeatureEnabled
            ? bundles.filter((b) => b.id && singleClusterBundles.includes(b.id))
            : bundles
          ).map((bundle) => (
            <GalleryItem key={bundle.id}>
              <BundleCard
                bundle={bundle}
                bundles={bundles}
                preflightRequirements={preflightRequirements}
              />
            </GalleryItem>
          ))}
        </Gallery>
      </StackItem>
    </Stack>
  );
};

export default OperatorsBundle;
