import com.mojang.serialization.Codec;
import com.mojang.serialization.MapCodec;
import java.util.Optional;

public class aai {
   public static final MapCodec<aag> a;
   public static final Codec<aag> b;
   public static final aao<xq, aag> c;
   public static final aao<xq, Optional<aag>> d;

   public static aah<?> a(jq<aah<?>> $$0) {
      jq.a($$0, (String)"blank", aae.b);
      jq.a($$0, (String)"styled", aaj.a);
      return (aah)jq.a($$0, (String)"fixed", aaf.a);
   }

   static {
      a = mi.al.q().dispatchMap(aag::a, aah::a);
      b = a.codec();
      c = aam.a(mj.af).b(aag::a, aah::b);
      d = c.a(aam::a);
   }
}
