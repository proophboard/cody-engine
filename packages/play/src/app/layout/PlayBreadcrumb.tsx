import * as React from 'react';
import {BreadcrumbFn} from "@frontend/app/pages/page-definitions";
import {useContext, useEffect, useState} from "react";
import {Typography, useTheme} from "@mui/material";
import {useQueryClient} from "@tanstack/react-query";
import {generatePath, Link, useParams} from "react-router-dom";
import {PlayPageDefinition} from "@cody-play/state/types";
import {staticLabel} from "@frontend/util/breadcrumb/static-label";
import {playGetVoRuntimeInfoFromDataReference} from "@cody-play/state/play-get-vo-runtime-info-from-data-reference";
import {CodyPlayConfig, configStore} from "@cody-play/state/config-store";
import {dynamicLabel} from "@frontend/util/breadcrumb/dynamic-label";
import {
  isQueryableNotStoredValueObjectDescription,
  isQueryableStateDescription,
  isQueryableStateListDescription,
  isQueryableValueObjectDescription
} from "@event-engine/descriptions/descriptions";
import {makeLocalApiQuery} from "@cody-play/queries/local-api-query";
import {User} from "@app/shared/types/core/user/user";
import {useUser} from "@frontend/hooks/use-user";
import {makeSyncExecutable} from "@cody-play/infrastructure/rule-engine/make-executable";
import jexl from "@app/shared/jexl/get-configured-jexl";
import {isDynamicBreadcrumb} from "@cody-engine/cody/hooks/utils/ui/types";

interface OwnProps {
  page: PlayPageDefinition;
  isLast: boolean;
}

type BreadcrumbProps = OwnProps;

const PlayBreadcrumb = (props: BreadcrumbProps) => {
  const theme = useTheme();
  const [label, setLabel] = useState('');
  const queryClient = useQueryClient();
  const params = useParams();
  const {config} = useContext(configStore);
  const [user] = useUser();

  useEffect(() => getBreadcrumbFnFromPlayPage(props.page, config, user)(params as Record<string, string>, queryClient, l => setLabel(l)), []);


  if(props.isLast) {
    return <Typography
      key={props.page.route}
      sx={{color: theme.palette.primary.contrastText}}
      aria-current="page">{label}</Typography>
  } else {
    return <Link to={generatePath(props.page.route, params)}
                 key={props.page.route}
                 style={{color: theme.palette.primary.contrastText, textDecoration: 'none'}}
    >{label}</Link>
  }
};

export default PlayBreadcrumb;

export const getBreadcrumbFnFromPlayPage = (page: PlayPageDefinition, config: CodyPlayConfig, user: User): BreadcrumbFn => {
  if(typeof page.breadcrumb === "string") {
    return staticLabel(page.breadcrumb);
  } else if (isDynamicBreadcrumb(page.breadcrumb)){
    const vo = playGetVoRuntimeInfoFromDataReference(page.breadcrumb.data, page.service, config.types);
    const voDesc = vo.desc;

    if(!isQueryableStateDescription(voDesc) && !isQueryableValueObjectDescription(voDesc) && !isQueryableNotStoredValueObjectDescription(voDesc) && isQueryableStateListDescription(voDesc)) {
      return staticLabel(`Error! "${voDesc.name}" is not queryable`);
    }

    const {label} = page.breadcrumb;
    const query = (voDesc as unknown as {query: string}).query;

    return dynamicLabel(
      query,
        params => {
        return (makeLocalApiQuery(config, user))(query, params);
      },
      data => {
        let ctx = {data, value: ''};

        if(typeof label === "string") {
          ctx.value = jexl.evalSync(label, ctx);
        } else {
          const exe = makeSyncExecutable(label);
          ctx = exe(ctx);
        }

        return ctx.value;
      }
    )
  }

  return staticLabel('Breadcrumb Config Error!');
}
