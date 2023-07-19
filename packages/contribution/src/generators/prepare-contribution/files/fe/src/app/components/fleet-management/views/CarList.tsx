  import {Box, CircularProgress, Typography} from "@mui/material";
import {DataGrid, GridColDef, GridToolbar} from "@mui/x-data-grid";
import {useEffect} from "react";
import {triggerSideBarAnchorsRendered} from "@frontend/util/sidebar/trigger-sidebar-anchors-rendered";
import {GetCarList} from "@app/shared/queries/fleet-management/get-car-list";
import {useGetCarList} from "@frontend/queries/fleet-management/use-get-car-list";
import jexl from "@app/shared/jexl/get-configured-jexl";
import PageLink from "@frontend/app/components/core/PageLink";
import {CarDetails} from "@frontend/app/pages/fleet-management/car-details"
import NoRowsOverlay from "@frontend/app/components/core/table/NoRowsOverlay";

const CarList = (params: GetCarList) => {
  const query = useGetCarList(params);

  useEffect(() => {
    triggerSideBarAnchorsRendered();
  }, [params]);

  const columns: GridColDef[] = [
    {field: "carName", valueGetter: (params) => {
      const ctx: any = params;


ctx['value'] = jexl.evalSync("row.brand + ' ' + row.model", ctx)
;

      return ctx.value;
    },renderCell: params => <PageLink page={CarDetails} params={params.row}>{params.value}</PageLink>, headerName: "Car Name", flex: 1, },
{field: "productionYear", headerName: "Production Year", flex: 1, }
  ];

  return (
    <Box component="div">
      <Typography variant="h3" className="sidebar-anchor" sx={{padding: (theme) => theme.spacing(4), paddingLeft: 0}} id="component-fleet-management-car-list">Car List</Typography>
      {query.isLoading && <CircularProgress />}
      {query.isSuccess && <DataGrid
          columns={columns}
          rows={query.data}
          getRowId={row => row.vehicleId}
          sx={{width: "100%"}}
          slots={{
            toolbar: GridToolbar,
            noRowsOverlay: NoRowsOverlay,
          }}
          initialState={
            {pagination: {paginationModel: {pageSize: 5}}}
          }
          pageSizeOptions={[5, 10, 25]}
          density="comfortable"
      />}
    </Box>
  );
}

export default CarList;
