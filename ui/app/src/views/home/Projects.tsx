// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
  alpha,
  Box,
  CircularProgress,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from '@mui/material';
import { ChangeEvent, ReactElement, useCallback, useMemo, useState } from 'react';
import { getResourceDisplayName } from '@perses-dev/core';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import Archive from 'mdi-material-ui/Archive';
import Magnify from 'mdi-material-ui/Magnify';
import { Link as RouterLink } from 'react-router-dom';
import { KVSearch } from '@nexucis/kvsearch';
import ChevronRight from 'mdi-material-ui/ChevronRight';
import { ProjectWithDashboards, useProjectsWithDashboards } from '../../model/project-client';
import { EmptyState } from '../../components/EmptyState/EmptyState';

/**
 * Generate a color for a project based on its name.
 * Uses a deterministic hash function to consistently assign colors to projects.
 * Note: Hardcoded colors are used here for decorative project avatars to ensure
 * distinct, visually appealing colors that work well for icons. This is an exception
 * to the general rule of using theme colors.
 */
function getProjectColor(projectName: string): string {
  const colors: string[] = [
    '#3B82F6',
    '#8B5CF6',
    '#10B981',
    '#F97316',
    '#EC4899',
    '#06B6D4',
    '#6366F1',
    '#F43F5E',
    '#14B8A6',
    '#F59E0B',
  ];
  let hash = 0;
  for (let i = 0; i < projectName.length; i++) {
    hash = projectName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  // Index is guaranteed to be within bounds due to modulo operation
  const color = colors[index];
  if (color) {
    return color;
  }
  // Fallback to first color (should never happen, but satisfies TypeScript)
  return colors[0]!;
}

interface ProjectCardProps {
  row: ProjectWithDashboards;
}

function ProjectCard({ row }: ProjectCardProps): ReactElement {
  const theme = useTheme();
  const dashboardsCount = row.dashboards.length;
  const projectName = getResourceDisplayName(row.project);
  const projectColor = getProjectColor(row.project.metadata.name ?? 'default');
  const projectDescription = dashboardsCount === 0 ? 'Ready for a first dashboard' : 'Browse dashboards and settings';

  return (
    <Paper
      elevation={0}
      component={RouterLink}
      to={`/projects/${row.project.metadata.name}`}
      aria-label={projectName}
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        cursor: 'pointer',
        textDecoration: 'none',
        color: 'inherit',
        backgroundColor: 'background.paper',
        transition: 'border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          borderColor: alpha(projectColor, 0.55),
          bgcolor: 'action.hover',
          boxShadow: (theme) => theme.shadows[1],
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Stack spacing={1.5}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                bgcolor: alpha(projectColor, theme.palette.mode === 'dark' ? 0.2 : 0.12),
                border: '1px solid',
                borderColor: alpha(projectColor, 0.3),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Archive sx={{ color: projectColor, fontSize: 18 }} />
            </Box>

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {projectName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {projectDescription}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              px: 1,
              py: 0.5,
              borderRadius: 999,
              bgcolor: 'action.hover',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {dashboardsCount} dashboard{dashboardsCount !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
          <Typography variant="caption" color="text.secondary">
            Open project workspace
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
            <ChevronRight fontSize="small" />
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
}

interface RenderProjectGridProps {
  projectRows: ProjectWithDashboards[];
  searchQuery: string;
}

function RenderProjectGrid(props: RenderProjectGridProps): ReactElement {
  const { projectRows, searchQuery } = props;

  if (projectRows.length === 0) {
    return (
      <EmptyState
        icon={<Archive sx={{ fontSize: 32, color: 'text.secondary' }} />}
        message={searchQuery ? `No projects found matching "${searchQuery}"` : 'No projects found'}
        hint={searchQuery ? 'Try a broader search or sort by dashboard count.' : 'Create a new project to get started.'}
        sx={{ py: 7 }}
      />
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'minmax(0, 1fr)',
          sm: 'repeat(2, minmax(0, 1fr))',
          lg: 'repeat(3, minmax(0, 1fr))',
          xl: 'repeat(4, minmax(0, 1fr))',
        },
        gap: 2,
      }}
    >
      {projectRows.map((row) => (
        <ProjectCard key={row.project.metadata.name} row={row} />
      ))}
    </Box>
  );
}

export function Projects(): ReactElement {
  const theme = useTheme();
  const kvSearch = useMemo(
    () =>
      new KVSearch<ProjectWithDashboards>({
        indexedKeys: [
          ['dashboards', 'metadata', 'project'], // Matching on the dashboard project name
          ['dashboards', 'metadata', 'name'], // Matching on the dashboard name
          ['dashboards', 'spec', 'display', 'name'], // Matching on the dashboard display name
          ['project', 'metadata', 'name'], // Matching on the project name
          ['project', 'metadata', 'display', 'name'], // Matching on the project display name
        ],
      }),
    []
  );

  const { data: projectRows, isLoading } = useProjectsWithDashboards();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortMode, setSortMode] = useState<'name' | 'dashboards'>('name');

  const allProjectRows = useMemo(() => projectRows ?? [], [projectRows]);

  const filteredProjectRows: ProjectWithDashboards[] = useMemo(() => {
    if (searchQuery) {
      return kvSearch.filter(searchQuery, allProjectRows).map((res) => res.original);
    } else {
      return allProjectRows;
    }
  }, [allProjectRows, kvSearch, searchQuery]);

  const sortedProjectRows = useMemo(() => {
    const rows = [...filteredProjectRows];

    rows.sort((a, b) => {
      if (sortMode === 'dashboards') {
        const dashboardDifference = b.dashboards.length - a.dashboards.length;
        if (dashboardDifference !== 0) {
          return dashboardDifference;
        }
      }

      const nameA = getResourceDisplayName(a.project).toLocaleLowerCase();
      const nameB = getResourceDisplayName(b.project).toLocaleLowerCase();
      return nameA.localeCompare(nameB);
    });

    return rows;
  }, [filteredProjectRows, sortMode]);

  const handleSearch = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleSortMode = useCallback((_event: React.MouseEvent<HTMLElement>, value: 'name' | 'dashboards' | null) => {
    if (value !== null) {
      setSortMode(value);
    }
  }, []);

  return (
    <Box component="section">
      <Stack spacing={2.5} sx={{ mb: 3 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', lg: 'flex-end' }}>
          <Stack spacing={0.75}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Archive sx={{ color: 'primary.main' }} />
              <Typography variant="h2">Projects</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Browse project workspaces and jump into the dashboards you manage most.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Showing {sortedProjectRows.length} of {allProjectRows.length} project{allProjectRows.length !== 1 ? 's' : ''}
            </Typography>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={sortMode}
              onChange={handleSortMode}
              aria-label="Sort projects"
              sx={{
                '& .MuiToggleButton-root': {
                  borderColor: 'divider',
                  color: 'text.secondary',
                  px: 1.5,
                  textTransform: 'none',
                },
                '& .Mui-selected': {
                  bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.22 : 0.12),
                  color: 'primary.main',
                },
              }}
            >
              <ToggleButton value="name">Name</ToggleButton>
              <ToggleButton value="dashboards">Dashboards</ToggleButton>
            </ToggleButtonGroup>

            <Box sx={{ width: { xs: '100%', sm: 280, lg: 320 } }}>
              <TextField
                placeholder="Search projects..."
                value={searchQuery}
                onChange={handleSearch}
                size="small"
                fullWidth
                aria-label="Search a Project or a Dashboard"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'action.hover',
                    '& input': {
                      py: 1.1,
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Magnify fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Stack>
        </Stack>

        {searchQuery && (
          <Typography variant="caption" color="text.secondary">
            Filtered by "{searchQuery}"
          </Typography>
        )}
      </Stack>

      {isLoading ? (
        <Stack width="100%" sx={{ alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Stack>
      ) : (
        <ErrorBoundary FallbackComponent={ErrorAlert}>
          <RenderProjectGrid projectRows={sortedProjectRows} searchQuery={searchQuery} />
        </ErrorBoundary>
      )}
    </Box>
  );
}
