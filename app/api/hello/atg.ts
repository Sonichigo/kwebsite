import { gql, useSubscription } from "@apollo/client";
import { useState } from "react";

// submitCodeSnippet.ts
export const submitCodeSnippet = async ({
  language,
  schema,
  code,
}: {
  language: string;
  schema: string;
  code: string;
}) => {
  try {
    const headers = {
      "Content-Type": "application/json",
    };

    const requestBody = {
      query: `
        mutation SubmitCode($language: String!, $schema: String!, $code: String!) {
          submitCode(language: $language, schema: $schema, code: $code) {
            code_submission_id
          }
        }
      `,
      variables: { language, schema, code },
    };

    const options: RequestInit = {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    };

    const response = await fetch(
      "https://landing-page.staging.keploy.io/query",
      options
    );
    const responseData = await response.json();

    if (response.ok && responseData?.data?.submitCode?.code_submission_id) {
      return responseData.data.submitCode.code_submission_id;
    } else {
      console.error("Error in response:", responseData.errors || responseData);
      return null;
    }
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        console.error("Fetch aborted");
      } else {
        console.error("ERROR DURING FETCH REQUEST", err);
      }
    } else {
      console.error("An unknown error occurred", err);
    }
    return null;
  }
};

type RunCommandSubscriptionParams = {
  codeSubmissionId: string;
  command: string;
  testSetName?: string; // Optional parameter
};

const RUN_COMMAND_SUBSCRIPTION = gql`
  subscription RunCommand(
    $code_submission_id: String!
    $command: String!
    $test_set_name: String
  ) {
    runCommand(
      code_submission_id: $code_submission_id
      command: $command
      test_set_name: $test_set_name
    )
  }
`;

export const useRunCommandSubscription = ({
  codeSubmissionId: initialCodeSubmissionId,
  command: initialCommand,
  testSetName, // Optional parameter
}: RunCommandSubscriptionParams) => {
  const [codeSubmissionId, setCodeSubmissionId] = useState<string>(
    initialCodeSubmissionId
  );
  const [command, setCommand] = useState<string>(initialCommand);
  const [submitted, setSubmitted] = useState(false);

  const { data, loading, error } = useSubscription(RUN_COMMAND_SUBSCRIPTION, {
    variables: {
      code_submission_id: codeSubmissionId,
      command,
      test_set_name: testSetName, // Include testSetName if provided
    },
    skip: !submitted, // Skip the subscription until the form is submitted
  });

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSubmitted(true); // Trigger the subscription
  };

  return { data, loading, error, handleSubmit };
};

// API for tests.

type CommandResponse = {
  success: boolean;
  data?: any;
  error?: string;
};

async function postRequest(
  endpoint: string,
  query: string,
  variables: any
): Promise<CommandResponse> {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const data = await response.json();
    return { success: response.ok, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function fetchTestSets(
  codeSubmissionId: string
): Promise<CommandResponse> {
  const query = `
    subscription FetchTestSets($code_submission_id: String!, $command: String!) {
      runCommand(code_submission_id: $code_submission_id, command: $command)
    }
  `;
  const variables = {
    code_submission_id: codeSubmissionId,
    command: "FETCH_TEST_SETS",
  };
  return await postRequest(
    "https://landing-page.staging.keploy.io/query",
    query,
    variables
  );
}

export async function fetchTestList(
  codeSubmissionId: string,
  testSetName: string
): Promise<CommandResponse> {
  const query = `
    subscription FetchTestList($code_submission_id: String!, $command: String!, $test_set_name: String!) {
      runCommand(code_submission_id: $code_submission_id, command: $command, test_set_name: $test_set_name)
    }
  `;
  const variables = {
    code_submission_id: codeSubmissionId,
    command: "FETCH_TESTS_LIST",
    test_set_name: testSetName,
  };
  return await postRequest(
    "https://landing-page.staging.keploy.io/query",
    query,
    variables
  );
}

export async function fetchTest(
  codeSubmissionId: string,
  testSetName: string,
  testCaseName: string
): Promise<CommandResponse> {
  const query = `
    subscription FetchTest($code_submission_id: String!, $command: String!, $test_set_name: String!, $test_case_name: String!) {
      runCommand(code_submission_id: $code_submission_id, command: $command, test_set_name: $test_set_name, test_case_name: $test_case_name)
    }
  `;
  const variables = {
    code_submission_id: codeSubmissionId,
    command: "FETCH_TEST",
    test_set_name: testSetName,
    test_case_name: testCaseName,
  };
  return await postRequest(
    "https://landing-page.staging.keploy.io/query",
    query,
    variables
  );
}
//for the curl  command
export async function curlCommand(
  codeSubmissionId: string,
  customCommand: string
): Promise<CommandResponse> {
  const query = `
    subscription CurlCommand($code_submission_id: String!, $command: String!, $command_content: String!) {
      runCommand(code_submission_id: $code_submission_id, command: $command, command_content: $command_content)
    }
  `;
  const variables = {
    code_submission_id: codeSubmissionId,
    command: "CURL",
    command_content: customCommand,
  };
  return await postRequest(
    "https://landing-page.staging.keploy.io/query",
    query,
    variables
  );
}

export async function fetchMock(
  codeSubmissionId: string,
  testSetName: string
): Promise<CommandResponse> {
  const query = `
    subscription FetchMock($code_submission_id: String!, $command: String!, $test_set_name: String!) {
      runCommand(code_submission_id: $code_submission_id, command: $command, test_set_name: $test_set_name)
    }
  `;
  const variables = {
    code_submission_id: codeSubmissionId,
    command: "FETCH_MOCK",
    test_set_name: testSetName,
  };
  return await postRequest(
    "https://landing-page.staging.keploy.io/query",
    query,
    variables
  );
}

//api for fetching the test-run:
export async function fetchTestRun(
  codeSubmissionId: string
): Promise<CommandResponse> {
  // Removed the `reportName` parameter since it's no longer needed
  const query = `
    subscription RunCommand($code_submission_id: String!, $command: String!) {
      runCommand(code_submission_id: $code_submission_id, command: $command)
    }
  `;
  const variables = {
    code_submission_id: codeSubmissionId,
    command: "FETCH_TEST_RUNS",
  };
  return await postRequest(
    "https://landing-page.staging.keploy.io/query",
    query,
    variables
  );
}

//api for the  fetching the files'name inside the report folder(coverage.yaml etc).
export async function fetchReport(
  codeSubmissionId: string,
  testRunName: string // Changed variable name for clarity
): Promise<CommandResponse> {
  const query = `
    subscription RunCommand($code_submission_id: String!, $command: String!, $test_run_name: String!) {
      runCommand(code_submission_id: $code_submission_id, command: $command, test_run_name: $test_run_name)
    }
  `;
  const variables = {
    code_submission_id: codeSubmissionId,
    command: "FETCH_TEST_SET_REPORTS",
    test_run_name: testRunName, // Updated to match the query
  };
  return await postRequest(
    "https://landing-page.staging.keploy.io/query",
    query,
    variables
  );
}

//api for fetching the contents of report.
export async function fetchDetailedReport(
  codeSubmissionId: string,
  testRunName: string,
  testSetReportName: string // Added a new parameter for test_set_report_name
): Promise<CommandResponse> {
  const query = `
    subscription RunCommand($code_submission_id: String!, $command: String!, $test_run_name: String!, $test_set_report_name: String!) {
      runCommand(code_submission_id: $code_submission_id, command: $command, test_run_name: $test_run_name, test_set_report_name: $test_set_report_name)
    }
  `;
  const variables = {
    code_submission_id: codeSubmissionId,
    command: "FETCH_REPORT",
    test_run_name: testRunName,
    test_set_report_name: testSetReportName // Updated to match the query
  };
  return await postRequest(
    "https://landing-page.staging.keploy.io/query",
    query,
    variables
  );
}

export async function RemovingDuplicate(
  codeSubmissionId: string,
  testSetName: string
): Promise<CommandResponse> {
  const query = `
    subscription RunCommand($code_submission_id: String!, $command: String!, $test_set_name: String!) {
      runCommand(
        code_submission_id: $code_submission_id, 
        command: $command, 
        test_set_name: $test_set_name
      )
    }
  `;
  const variables = {
    code_submission_id: codeSubmissionId,
    command: "REMOVE_DUPLICATES",
    test_set_name: testSetName,
  };
  return await postRequest(
    "https://landing-page.staging.keploy.io/query",
    query,
    variables
  );
}