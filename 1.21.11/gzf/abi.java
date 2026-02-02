import com.google.common.collect.Lists;
import java.util.List;
import java.util.function.Consumer;

public record abi(acd c) implements aay<abg> {
   private static final int d = 1048576;
   public static final aao<xq, abi> a;
   public static final aao<wx, abi> b;

   public abi(acd param1) {
      this.c = $$0;
   }

   public aba<abi> a() {
      return abu.b;
   }

   public void a(abg $$0) {
      $$0.a(this);
   }

   public acd b() {
      return this.c;
   }

   static {
      a = acd.a(($$0) -> {
         return ace.a($$0, 1048576);
      }, (List)bhs.a((Object)Lists.newArrayList(new acd.c[]{new acd.c(acc.b, acc.a)}), (Consumer)(($$0) -> {
      }))).a(abi::new, abi::b);
      b = acd.a(($$0) -> {
         return ace.a($$0, 1048576);
      }, List.of(new acd.c(acc.b, acc.a))).a(abi::new, abi::b);
   }
}
