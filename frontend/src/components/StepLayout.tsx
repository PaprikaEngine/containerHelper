import React from 'react';
import { Container, Paper, Title, Group, Button, Progress, Text, Stack } from '@mantine/core';

interface StepLayoutProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  children: React.ReactNode;
  onNext?: () => void;
  onPrev?: () => void;
  nextDisabled?: boolean;
}

export const StepLayout: React.FC<StepLayoutProps> = ({
  currentStep,
  totalSteps,
  title,
  children,
  onNext,
  onPrev,
  nextDisabled = false,
}) => {
  const progressValue = (currentStep / totalSteps) * 100;

  return (
    <Container size="lg" py="xl" style={{ minHeight: '100vh' }} bg="gray.0">
      <Stack gap="xl">
        {/* Progress section */}
        <Paper shadow="sm" p="md">
          <Group justify="space-between" mb="xs">
            <Text size="sm" c="dimmed">
              Step {currentStep} of {totalSteps}
            </Text>
            <Text size="sm" c="dimmed">
              {Math.round(progressValue)}% Complete
            </Text>
          </Group>
          <Progress value={progressValue} size="sm" radius="xl" />
        </Paper>

        {/* Main content */}
        <Paper shadow="lg" p="xl" radius="md">
          <Title order={1} mb="xl" c="dark">
            {title}
          </Title>

          <Stack gap="xl" mb="xl">
            {children}
          </Stack>

          {/* Navigation buttons */}
          <Group justify="space-between">
            <Button
              variant="outline"
              onClick={onPrev}
              disabled={currentStep === 1}
              size="md"
            >
              Previous
            </Button>

            <Button
              onClick={onNext}
              disabled={nextDisabled || currentStep === totalSteps}
              size="md"
            >
              {currentStep === totalSteps ? 'Run Container' : 'Next'}
            </Button>
          </Group>
        </Paper>
      </Stack>
    </Container>
  );
};