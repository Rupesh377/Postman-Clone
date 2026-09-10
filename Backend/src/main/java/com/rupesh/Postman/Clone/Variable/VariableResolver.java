package com.rupesh.Postman.Clone.Variable;

import com.rupesh.Postman.Clone.Environment.EnvironmentVariable.EnvironmentVariableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class VariableResolver {

    private final EnvironmentVariableRepository variableRepository;

    private static final Pattern VARIABLE_PATTERN = Pattern.compile("\\{\\{([^{}]+)}}");

    public String resolve(String text, Long environmentId) {

        if (text == null || text.isBlank())
            return text;


        Matcher matcher = VARIABLE_PATTERN.matcher(text);
        StringBuffer result = new StringBuffer();

        while (matcher.find())
        {
            String variableKey = matcher.group(1).trim();
            String value = variableRepository.findByVariableKeyAndEnvironmentId(variableKey, environmentId)
                    .map(variable -> variable.getVariableValue())
                    .orElse(matcher.group(0));

            matcher.appendReplacement(result, Matcher.quoteReplacement(value));
        }

        matcher.appendTail(result);
        return result.toString();
    }
}