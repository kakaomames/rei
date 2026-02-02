import com.google.common.collect.ImmutableMap;
import com.google.common.collect.ImmutableMap.Builder;
import com.mojang.logging.LogUtils;
import java.util.Collection;
import java.util.Iterator;
import java.util.Map;
import org.jspecify.annotations.Nullable;
import org.slf4j.Logger;

public class ang extends bbd<ab> {
   private static final Logger a = LogUtils.getLogger();
   private Map<amo, ac> b = Map.of();
   private ah c = new ah();
   private final jf.a d;

   public ang(jf.a $$0) {
      super($$0, ab.a, mj.bJ);
      this.d = $$0;
   }

   protected void a(Map<amo, ab> $$0, baz $$1, bzm $$2) {
      Builder<amo, ac> $$3 = ImmutableMap.builder();
      $$0.forEach(($$1x, $$2x) -> {
         this.a($$1x, $$2x);
         $$3.put($$1x, new ac($$1x, $$2x));
      });
      this.b = $$3.buildOrThrow();
      ah $$4 = new ah();
      $$4.a(this.b.values());
      Iterator var6 = $$4.b().iterator();

      while(var6.hasNext()) {
         ad $$5 = (ad)var6.next();
         if ($$5.b().b().c().isPresent()) {
            ap.a($$5);
         }
      }

      this.c = $$4;
   }

   private void a(amo $$0, ab $$1) {
      bgp.a $$2 = new bgp.a();
      $$1.a((bgp)$$2, (je.a)this.d);
      if (!$$2.a()) {
         a.warn("Found validation problems in advancement {}: \n{}", $$0, $$2.b());
      }

   }

   @Nullable
   public ac a(amo $$0) {
      return (ac)this.b.get($$0);
   }

   public ah a() {
      return this.c;
   }

   public Collection<ac> b() {
      return this.b.values();
   }
}
